function mapNumber(num,from,to,mFrom,mTo,interpolation){
					if (interpolation == 'CubeDecel'){
						return mFrom + (mTo - mFrom)*interCubeDecel((num - from)/(to - from));
					} else if (interpolation == 'CubeAccel'){
						return mFrom + (mTo - mFrom)*interCubeAccel((num - from)/(to - from));
					} else {
						return mFrom + (mTo - mFrom)*(num - from)/(to - from);
					};
			};
function mapColor(num,from,to,rs,gs,bs,rf,gf,bf){
			var r = Math.floor(mapNumber(num,from,to,rs,rf));
			var g = Math.floor(mapNumber(num,from,to,gs,gf));
			var b = Math.floor(mapNumber(num,from,to,bs,bf));
			r = r < 0 ? 0 : r > 255 ? 255 : r;
			g = g < 0 ? 0 : g > 255 ? 255 : g;
			b = b < 0 ? 0 : b > 255 ? 255 : b;
			return 'rgba('+r+','+g+','+b+',1)';
	};

function Resource(parent,link){
	//this.parent = parent;
	this.img = new Image();
	this.img.src = link;
	this.img.onload = function(){
		parent.resourcesLoaded++;
		parent.checkIfReady(); 
	};
};

function Cell(parentDW,storage,a,b,weight,timesShown,lastFired,lastTime){
	this.a = a;
	this.b = b;
	this.firstDigitA = +(a+'')[0];
	this.firstDigitA = +(b+'')[0];
	this.lastDigitA = a < 10 ? a : +(a+'')[1];
	this.lastDigitB = b < 10 ? b : +(b+'')[1];
	this.c = a+b;
	this.string = a+' + '+b+' = ';
	//this.stringA = ['',' ⋅ '+b+' = '+this.c];
	//this.stringB = [a+' ⋅ ',' = '+this.c];
	//this.stringR = b+' ⋅ '+a+' = ';
	this.correctString = this.c.toString();
	this.correctStringA = this.a.toString();
	this.correctStringB = this.b.toString();
	this.weight = weight || parentDW;
	this.timesShown = timesShown || 0;
	this.lastFired = lastFired || false;
	this.lastTime = lastTime || false;

	if ((this.a+'').length == 2 && (this.b+'').length == 2){
		this.numberOfDoubles = 2;
	} else if ((this.a+'').length == 2 || (this.b+'').length == 2){
		this.numberOfDoubles = 1;
	} else {
		this.numberOfDoubles = 0;
	}

	var isSingles = this.a <= 10 && this.b <= 10,
		have1 = this.a == 1 || this.b == 1,
		isMixed = (this.a > 10 || this.b > 10) && (this.a <= 10 || this.b <= 10),
		isDoubles = this.a > 10 && this.b > 10,
		isWithin10 = this.c <= 10,
		isWithin20 = this.c <= 20,
		isWithin100 = this.c <= 100,
		isOver1 = this.lastDigitA + this.lastDigitB > 10,
		isOver10 = this.a > 10 && this.b > 10 && this.a - this.lastDigitA + this.b - this.lastDigitB > 100;

	if (isSingles && isWithin10) {this.grade = 0}
	else if (isSingles && !isWithin10) {this.grade = 1}
	else if ((this.a % 10 == 0 && this.b % 10 == 0) || have1 || ((this.a % 10 == 0 || this.b % 10 == 0) && isMixed)) {this.grade = 2}
	else if (isMixed && !isOver1) {this.grade = 3}
	else if (isWithin100 && !isOver1) {this.grade = 4}
	else if (isWithin100 && isOver1) {this.grade = 5}
	else if (!isOver1 || isMixed) {this.grade = 6}
	else if (isOver1) {this.grade = 7}
	else {this.grade = 0}

	storage[this.grade].push(this);

};
Cell.prototype.startWatch = function(){
	this.timesShown ++;
	this.lastFired = Date.now();
};
Cell.prototype.stopWatch = function(){
	this.lastTime = Date.now() - this.lastFired;
};
Cell.prototype.getString = function(type){
	if (type == 1){
		return this.stringA[0]+' &nbsp; '+this.stringA[1];
	} else if (type == 2){
		return this.stringB[0]+' &nbsp; '+this.stringB[1];
	} else {
		return this.string;
	}
};
Cell.prototype.getCorrectString = function(type){
	return type == 1 ? this.correctStringA : type == 2 ? this.correctStringB : this.correctString;
};

function CoreS(container,linkArray,saveFunction,loadString){
	this.ratio = window.devicePixelRatio;
	this.cellSize = 0;

	this.container = container;
	this.resources = [];
	this.resourcesLoaded = 0;
	this.isReady = false;
	this.saveFunction = saveFunction || function(){};
	this.loadString = loadString || false;
	this.help = true;
	this.isLvlUp = false;

	// Setting up all texts
	this.intro = {
		header : 'Пора научиться складывать быстро',
		text : 'Справа — таблица из чисел от 1 до 100, которые мы будем складывать.',
		image : false
	}
	this.grades = [
			{
				id : 0,
				header : 'Глава 1: Элементарно',
				text : 'Отлично! Справа в таблице видны примеры, которые только что решались. Теперь нужно привыкнуть к самым простым примерам: запомнить сумму чисел в пределах десяти. Жми энтер или тыкай в экран, если в него можно тыкать!',
				image : false
			},
			{
				id : 1,
				header : 'Глава 2: Шутки в сторону',
				text : 'Теперь примеры станут чуть сложнее. Лучше всего их просто запомнить. Чем быстрее их решаешь, тем проще будет вплоть до института.',
				image : false
			},
			{
				id : 2,
				header : 'Глава 3: На пути к&nbsp;совершенству',
				text : 'Теперь можно передохнуть. Ты можешь увидеть большие числа, но считать их будет не сложнее, чем маленькие.',
				image : false
			},
			{
				id : 3,
				header : 'Глава 4: Грядущая буря',
				text : 'По-настоящему трудные примеры уже близко. Пора размяться по-серьезному. Чтобы пройти дальше, нужно решать без ошибок. Это быстрее, чем спешить, но ошибаться.',
				image : false
			},
			{
				id : 4,
				header : 'Глава 5: На поле сложений',
				text : 'Мы знаем на что способен твой мозг. Теперь нужно вспомнить всё и выложиться по полной.',
				image : false
			},
			{
				id : 5,
				header : 'Глава 6: Выживание',
				text : 'Недостаточно сложно? Всё, что было до этого покажется ерундой. С этого момента начинается настоящая математика',
				image : false
			},
			{
				id : 6,
				header : 'Глава 7: Другой мир',
				text : 'Не смотря на большие числа, тут не так сложно, как можно предположить. Но не стоит расслабляться — на горизонте виднеется что-то финальное и не сравнимое по трудности со всем остальным.',
				image : false
			},
			{
				id : 7,
				header : 'Глава 8: Нереальное адищще невозможности',
				text : 'Квинтэссенция безумия, закрученная в оболочку чисел и знаков. Огнедыщащая бездна сверхсумасшедших примеров. Решить всё под силу только настоящим героям. Тебе?',
				image : false
			}

		];

	this.initSortedStorage();

	this.mode = -1;

	//Current example fired properties
	this.currentExample = false;
	this.currentType = false;
	this.exampleIsReady = false;
	this.correctString = false;
	this.input = '';
	this.totalCount = 10;
	this.count = 0;

	this.combo = 0;
	this.defaultWeight = 100;
	this.grade = 0;
	this.goodTime = 5000; // Answer time without penalty
	this.penalty = 2000; // Adds to the weight if you are wrong
	this.justFired = false;

	// Setting up table with default values
	this.storage = [];
	for (let i = 0; i < 10000; i++){
		this.storage.push(new Cell(this.defaultWeight, this.sortedStorage,Math.floor(i/100) + 1,i%100 + 1));
		//this.sortedStorage[this.storage[i].grade].push(this.storage[i]);
	};

	//Initializing resources
	if (linkArray){
		for (let i=0;i<linkArray.length;i++){
			this.resources.push(new Resource(this,linkArray[i]));
		}
	} else {
		this.isReady = true;
	}

	//Now adding all entrails
	this.guts = '<div class = "ssmt_half1"><div class = "ssmt_header" style="opacity: 0"><h1 class = "ssmt_headerh1">Пора научиться складывать быстро</h1><p class = "ssmt_headertext">Справа — таблица из чисел от 1 до 100, которые мы будем складывать.<br />Разберемся по ходу дела! Жми энтер или тыкай в экран, если в него можно тыкать и начинай решать простые примеры.</p><div class = "ssmt_stats"><p>Примеров решено: <span class = "ssmt_totalCount">0</span></p><p>Комбо без ошибок: <span class = "ssmt_combo">0</span></p><p>Среднее время на ответ: <span class = "ssmt_atime">0</span></p><p>Нелюбимый пример: <span class = "ssmt_worst">0</span></p></div></div></div><div class = "ssmt_half2"><canvas class = "ssmt_canvas"></canvas></div><div class ="ssmt_hint"></div><div class ="ssmt_mark"></div><div class = "ssmt_example">x × y = </div><input class="ssmt_numpad" type="tel">';
	this.container.innerHTML = this.guts;

	//Getting entrails as variables
	this.nodes = [];
	this.nodes.example = document.getElementsByClassName('ssmt_example')[0];
	this.nodes.header = document.getElementsByClassName('ssmt_header')[0];
	this.nodes.canvas = document.getElementsByClassName('ssmt_canvas')[0];
	this.ctx = this.nodes.canvas.getContext('2d');
	this.nodes.numpad = document.getElementsByClassName('ssmt_numpad')[0];
	this.nodes.half1 = document.getElementsByClassName('ssmt_half1')[0];
	this.nodes.half2 = document.getElementsByClassName('ssmt_half2')[0];

	this.nodes.totalCount = document.getElementsByClassName('ssmt_totalCount')[0];
	this.nodes.combo = document.getElementsByClassName('ssmt_combo')[0];
	this.nodes.aTime = document.getElementsByClassName('ssmt_atime')[0];
	this.nodes.worst = document.getElementsByClassName('ssmt_worst')[0];

	this.nodes.h1 = document.getElementsByClassName('ssmt_headerh1')[0];
	this.nodes.text = document.getElementsByClassName('ssmt_headertext')[0];

	this.nodes.hint = document.getElementsByClassName('ssmt_hint')[0];
	this.nodes.mark = document.getElementsByClassName('ssmt_mark')[0];

	//Setting up event listeners
	var shitcodeThis = this;
	window.onresize = function(e){
		shitcodeThis.updateLayout();
		console.log('Why are you moving stuff all around?')
	};
	window.addEventListener('keydown',function(e){
		if (shitcodeThis.mode == 1){
			if (e.keyCode <= 57){
				shitcodeThis.acceptKey(e.keyCode - 48);
			} else {
				shitcodeThis.acceptKey(e.keyCode - 96)
			}
		} else if (shitcodeThis.mode == 0 && e.keyCode == 13){
			shitcodeThis.switchMode(1);
		}
	});
	document.body.addEventListener('touchstart',function(){
		if (shitcodeThis.isMobile){
			if (shitcodeThis.mode == 0) {
				shitcodeThis.switchMode(1);
			}
			shitcodeThis.nodes.numpad.focus();
		}
	});
	this.nodes.numpad.addEventListener('blur',function(){
		if (shitcodeThis.isMobile && shitcodeThis.mode == 1){
			shitcodeThis.numpad.focus();
		}
	});
	this.nodes.canvas.addEventListener('mousemove',function(e){
		shitcodeThis.nodes.hint.style.left = (e.clientX - shitcodeThis.container.getBoundingClientRect().left) + 'px';
		shitcodeThis.nodes.hint.style.top = (e.clientY - shitcodeThis.container.getBoundingClientRect().top - 80) + 'px';

		var pointerX = Math.floor(e.offsetX);
		var pointerY = Math.floor(e.offsetY);

		if (pointerX < shitcodeThis.cellSize*100 && pointerY < shitcodeThis.cellSize*100){
			var pointer = Math.floor(pointerX/shitcodeThis.cellSize) + Math.floor(pointerY/shitcodeThis.cellSize)*100;
		} else {
			var pointer = -1;
		};

		if (shitcodeThis.storage[pointer]) {
			shitcodeThis.nodes.hint.innerHTML = shitcodeThis.storage[pointer].string + shitcodeThis.storage[pointer].c + '<br />Сложность: ' + (shitcodeThis.storage[pointer].grade+1) + '<br />' + (shitcodeThis.storage[pointer].timesShown > 0 ? 'Встречался '+shitcodeThis.storage[pointer].timesShown+ ([2,3,4].indexOf(shitcodeThis.storage[pointer].timesShown%10) != -1 ? ' раза' : ' раз') : 'Не встречался');
			shitcodeThis.nodes.mark.style.width = shitcodeThis.nodes.mark.style.height = shitcodeThis.cellSize/2 + 'px';
			shitcodeThis.nodes.mark.style.left = ((pointer%100)*shitcodeThis.cellSize + shitcodeThis.nodes.canvas.getBoundingClientRect().left - shitcodeThis.container.getBoundingClientRect().left + shitcodeThis.cellSize/4)+'px';
			shitcodeThis.nodes.mark.style.top = (Math.floor(pointer/100)*shitcodeThis.cellSize + shitcodeThis.nodes.canvas.getBoundingClientRect().top - shitcodeThis.container.getBoundingClientRect().top + shitcodeThis.cellSize/4)+'px';
		}
	});
	this.nodes.canvas.addEventListener('mouseover',function(e){
		shitcodeThis.nodes.hint.style.display = 'flex';
		shitcodeThis.nodes.mark.style.display = 'block';
	});
	this.nodes.canvas.addEventListener('mouseleave',function(e){
		shitcodeThis.nodes.hint.style.display = 'none';
		shitcodeThis.nodes.mark.style.display = 'none';
	});

	//Looking for something to load
	if (this.loadString){
		var loadStringJSON = JSON.stringify(loadString);
		localStorage.setItem('SUM', loadStringJSON);
	};

	// Checking if ready to run (probably not yet)
	if (this.isReady) this.run();
};
CoreS.prototype.initSortedStorage = function(){
	this.sortedStorage = [];
	for (let i = 0; i < this.grades.length; i++){
		this.sortedStorage[i] = [];
	}
}
CoreS.prototype.checkIfReady = function(){
	if (this.resourcesLoaded >= this.resources.length){
	//	for (let i=0;i<this.grades.length;i++){
	//		this.grades[i].image = this.resources[i].img
	//	}
		this.isReady = true;
		console.log('All resources are ready');

		this.run();

	} else {
		console.log('Some resource is ready');
	}
};
CoreS.prototype.run = function(){
	this.deviceSetup();
	this.load();
}

CoreS.prototype.updateStats = function(){
	this.updateLayout();

	var totalCount = 0,
		aTime = 0,
		activeExamples = 0,
		worst = {weight:0,string:'Еще не встречался'};

	this.nodes.canvas.width = this.nodes.half2.offsetWidth * this.ratio;
	this.nodes.canvas.height = this.nodes.half2.offsetHeight * this.ratio;
	this.cellSize = Math.floor(this.nodes.canvas.width / 100)/this.ratio;
	for (let i = 0; i < this.storage.length; i++){
		totalCount += this.storage[i].timesShown;
		if (this.storage[i].lastTime){
			activeExamples++;
			aTime += this.storage[i].lastTime;
			if (this.storage[i].weight > this.defaultWeight){
					this.ctx.fillStyle = mapColor(this.storage[i].weight,this.defaultWeight,10000,255,214,186,226,6,48);
				} else if (this.storage[i].weight > 1){
					this.ctx.fillStyle = mapColor(this.storage[i].weight,0,this.defaultWeight,144,236,123,227,255,208);
				} else {
					this.ctx.fillStyle = 'rgb(255,242,96)';
				}
			if (this.storage[i].weight > worst.weight){
				worst.weight = this.storage[i].weight;
				worst.string = worst.weight > this.defaultWeight ? this.storage[i].string + '' + this.storage[i].c : 'Все любимые';
			}
		} else {
			this.ctx.fillStyle = mapColor(this.storage[i].grade,0,this.grades.length,240,240,240,220,220,255);
		}
		this.ctx.fillRect(this.cellSize * this.ratio * (i % 100),this.cellSize * this.ratio * Math.floor(i/100), this.cellSize * this.ratio, this.cellSize * this.ratio);
	};

	// Calculating text stats
	aTime = activeExamples > 0 ? Math.round(aTime / activeExamples)/1000+' с' : 'Еще не посчиталось'; 
	this.nodes.totalCount.innerHTML = totalCount;
	this.nodes.combo.innerHTML = this.combo;
	this.nodes.aTime.innerHTML = aTime;
	this.nodes.worst.innerHTML = worst.string;
	this.updateGrade();
};
CoreS.prototype.updateGrade = function(){
	let currentGrade = this.grade;
	if (this.grade == -1){
		this.grade = 0;
	}
	else if (this.grade == 0){
		var promote = true;
		for (let i = 0; i < this.sortedStorage[0].length; i++){
			if (this.sortedStorage[0][i].weight > 50) promote = false;
		}
		if (promote || this.combo > 19) this.grade = 1;
	} else if (this.grade == 1){
		var promote = true;
		for (let i = 0; i < this.sortedStorage[1].length; i++){
			if (this.sortedStorage[1][i].weight > 50) promote = false;
		}
		if (promote) this.grade = 2;
	} else if (this.grade == 2){
		var promote = 0;
		for (let i = 0; i < this.sortedStorage[2].length; i++){
			if (this.sortedStorage[2][i].timesShown > 0) promote++;
			if (this.sortedStorage[2][i].weight > 100) promote -= 30;
		}
		if (promote > 30) this.grade = 3;
	} else if (this.grade == 3){
		var promote = 0;
		for (let i = 0; i < this.sortedStorage[3].length; i++){
			if (this.sortedStorage[3][i].timesShown > 0) promote++;
			if (this.sortedStorage[3][i].weight > 100) promote -= 50;
		}
		if (promote > 50) this.grade = 4;
	} else if (this.grade == 4){
		var promote = 0;
		for (let i = 0; i < this.sortedStorage[4].length; i++){
			if (this.sortedStorage[4][i].timesShown > 0) promote++;
			if (this.sortedStorage[4][i].weight > 100) promote -= 50;
		}
		if (promote > 50) this.grade = 5;
	} else if (this.grade == 5){
		var promote = 0;
		for (let i = 0; i < this.sortedStorage[5].length; i++){
			if (this.sortedStorage[5][i].timesShown > 0) promote++;
			if (this.sortedStorage[5][i].weight > 100) promote -= 50;
		}
		if (promote > 50) this.grade = 6;
	} else if (this.grade == 6){
		var promote = 0;
		for (let i = 0; i < this.sortedStorage[6].length; i++){
			if (this.sortedStorage[6][i].timesShown > 0) promote++;
			if (this.sortedStorage[6][i].weight > 100) promote -= 50;
		}
		if (promote > 50) this.grade = 7;
	}
	console.log(this.grade, currentGrade, this.mode);
	if (this.grade > currentGrade && this.mode > 0){
		this.lvlUp();
	}
	if (!this.help){
		this.nodes.h1.innerHTML = this.grades[this.grade].header;
		this.nodes.text.innerHTML = this.grades[this.grade].text;
	} else {
		this.help = false;
	}
};
CoreS.prototype.updateLayout = function(){
	var hRatio = .5;
	var vRatio = .6;
	if (this.container.offsetWidth > this.container.offsetHeight){
		var minSide = Math.min(this.container.offsetWidth * hRatio,this.container.offsetHeight);
		this.nodes.half1.style.width = 95 - hRatio*100 + '%';
		this.nodes.half2.style.left = 100 - hRatio*100 + '%';
		this.nodes.half1.style.top = this.nodes.half2.style.top = this.nodes.half1.style.left = '0';
		this.nodes.half1.style.height = this.container.offsetHeight + 'px';
		this.nodes.half2.style.width = this.nodes.half2.style.height = minSide + 'px'; 
	} else {
		var minSide = Math.min(this.container.offsetHeight * vRatio,this.container.offsetWidth);
		this.nodes.half1.style.height = 100 - vRatio*100 + '%';
		this.nodes.half2.style.top = 100 - vRatio*100 + '%';
		this.nodes.half1.style.top ='0';
		this.nodes.half1.style.width = this.container.offsetWidth + 'px';
		this.nodes.half2.style.width = this.nodes.half2.style.height = this.nodes.half1.style.width = minSide + 'px';
		this.nodes.half2.style.left = this.nodes.half1.style.left = (this.container.offsetWidth - minSide)*.5 + 'px';
	}
};
CoreS.prototype.deviceSetup = function(){
	var isMobile = navigator.userAgent.match(/Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile/i) ? true : false;
	if (isMobile){
		this.nodes.example.style.height = '50%';
		this.isMobile = true;
	} else {
		this.isMobile = false;
	}
};
CoreS.prototype.switchMode = function(signal){
	let from = this.mode;
	if (this.mode != 0 && signal == 0){
		this.count = 0;
		this.justFired = false;
		this.updateStats();
		this.mode = 0;
		if (this.isMobile) this.nodes.numpad.blur();
		if (this.currentExample){
			this.currentExample = false;
			this.exampleOut(this.stopHammerTime.bind(this));
		} else {
			this.stopHammerTime();
		}
		
	} else if (this.mode != 1 && signal == 1){
		this.nodes.header.style.marginLeft = '0px';

		alive.animate(this.nodes.header,'margin-left','-100px',900,'CubeAccel');

		var shitcodeThis = this;
		alive.animate(this.nodes.header,'opacity',0,900,function(){
			shitcodeThis.mode = 1;
			shitcodeThis.fireExample();
		});

		this.dissolveTable();
	};
};
CoreS.prototype.stopHammerTime = function(){
	this.nodes.header.style.marginLeft = '-100px';
	alive.animate(this.nodes.header,'margin-left','0px',900,'CubeDecel');
	alive.animate(this.nodes.header,'opacity',1,900);

	this.nodes.canvas.style.opacity = '0';
	alive.animate(this.nodes.canvas,'opacity',1,1200)
};
CoreS.prototype.dissolveTable = function(){
	this.nodes.canvas.style.opacity = '1';
	alive.animate(this.nodes.canvas,'opacity',0,1200)
};
CoreS.prototype.fireExample = function(){
	var cauldron = [];
	for (let i=0;i<this.storage.length; i++){
		if (this.storage[i] != this.justFired && this.storage[i].grade == this.grade){
			for (let j=0;j<this.storage[i].weight;j++){
				cauldron.push(this.storage[i]);
			}
		}
	}
	var finger = Math.floor(Math.random()*cauldron.length);
	this.input = '';
	this.currentExample = cauldron[finger];
	this.justFired = this.currentExample;
	this.currentExample.startWatch();

	// EEEE XXXX PPPP EEEE RRRR IIII MMMM EEEE NNNN TTTT AAAA LLLL !!!!

	this.nodes.example.innerHTML = this.currentExample.getString(-1);
	this.exampleIsReady = true;

	this.correctString = this.currentExample.getCorrectString(-1);

	this.nodes.example.style.marginTop = '20px';
	alive.animate(this.nodes.example,'opacity',1,this.goodTime/2,'CubeDecel');
	alive.animate(this.nodes.example,'margin-top','0px',this.goodTime/2,'CubeDecel');
};
CoreS.prototype.exampleOut = function(endFunction){
	this.nodes.example.style.marginTop = '0px';
	alive.animate(this.nodes.example,'opacity',0,400,'CubeAccel');
	alive.animate(this.nodes.example,'margin-top','-10px',400,endFunction.bind(this),'CubeAccel');
};
CoreS.prototype.flash = function(isCorrect){
		this.nodes.example.style.color = isCorrect ? 'rgb(115,169,68)' : 'rgb(225,9,50)';
		alive.animate(this.nodes.example,'color','rgb(0,0,0)',600,'CubeDecel');
	}
CoreS.prototype.acceptKey = function(key){	
	if (key in [1,2,3,4,5,6,7,8,9,0] && this.exampleIsReady){
		this.input += key;

		/*if (this.currentType == 1){
			this.nodes.example.innerHTML = this.currentExample.stringA[0]+this.input+this.currentExample.stringA[1];
		} else if (this.currentType == 2){
			this.nodes.example.innerHTML = this.currentExample.stringB[0]+this.input+this.currentExample.stringB[1];
		} else {*/
			this.nodes.example.innerHTML = this.currentExample.string + this.input;
		//}
		if (this.input.length == this.correctString.length) {

			this.currentExample.stopWatch();
			this.exampleIsReady = false;

			if (this.input == this.correctString){this.goodSequence();} 
			else {this.badSequence();};
			this.correctString = false;

			//this.save();
			this.count ++;
			if (this.count >= this.totalCount){
				this.save(true);
				this.switchMode(0);
			} else {
				this.exampleOut(this.fireExample);
			}
		}
	}
};
CoreS.prototype.goodSequence = function(){
	this.flash(true);
	this.combo ++;
	if (this.currentExample.lastTime <= this.goodTime + this.currentExample.grade * 1000 /*|| this.grade < 2*/){
		this.currentExample.weight /= 2;
		if (this.currentExample.lastTime <= this.goodTime / 2){
			this.currentExample.weight -= 4;
			if (this.currentExample.weight < 1) this.currentExample.weight = 1;
		}
	} else {
		this.currentExample.weight += mapNumber(this.currentExample.lastTime,this.goodTime + this.currentExample.grade * 1000,(this.goodTime + this.currentExample.grade * 1000)*5,0,this.penalty);
	}
};
CoreS.prototype.badSequence = function(){
	this.flash(false);
	this.combo = 0;
	this.currentExample.weight += this.penalty;
};
CoreS.prototype.save = function(trueSave){
	var saveObj = {
		storage : this.storage,
		grade : this.grade,
		combo : this.combo,
		help : this.help
	};
	var saveString = JSON.stringify(saveObj);
	localStorage.setItem('SUM', saveString);
	if (trueSave && this.saveFunction) {
		this.saveFunction(saveObj);
	}
};
CoreS.prototype.load = function(){
	var memory = JSON.parse(localStorage.getItem('SUM'));
	
	if (memory){
		this.combo = memory.combo;
		this.grade = memory.grade;
		this.help = memory.help;
		this.initSortedStorage();
		for (let i=0;i<10000;i++){		
			this.storage[i] = new Cell(this.defaultWeight, this.sortedStorage, Math.floor(i/100) + 1,i%100 + 1,memory.storage[i].weight,memory.storage[i].timesShown,memory.storage[i].lastFired,memory.storage[i].lastTime);
		}
		console.log('Loaded data from local storage');
		this.mode = -1;
	};
	this.switchMode(0);
	
};
CoreS.prototype.drop = function(){
	var drop = confirm("Cбросить все результаты и снова стать никем?");
        if (drop) {
            localStorage.setItem('SUM',false);
            location.reload();
    	}
};
CoreS.prototype.lvlUp = function(){
	let lvlup = document.createElement('div');
	let container = this.container;
	lvlup.addEventListener('animationend', function(){
		console.log('LVLUP');
		container.removeChild(lvlup);
	});
	lvlup.classList.add('ssmt_lvlUp');
	container.appendChild(lvlup);
}