"use strict"

//title screen

//make it not so screen-size dependent
//super-large game area
//framerate independence?
//maybe have a game size option

//[x] high contrast mode
//[x] redo art to suit tiny sprites
//[x] gamepad controls
//[x] spawn effects to help spot things
//[x] game ends when you reach a certain score
//[x] sound

//DOM stuff
var canvas = document.querySelector(".gameCanvas")
var ctx = canvas.getContext('2d')
ctx.webkitImageSmoothingEnabled = false
ctx.mozImageSmoothingEnabled = false
ctx.imageSmoothingEnabled = false
var width = canvas.width
var height = canvas.height
var loaded = false

var spriteImage = new Image()
spriteImage.src = 'sprites.png'
spriteImage.addEventListener('load', function() {
  loaded = true
}, false)

function tick() {
  if (loaded) {
  	tickGame()
  }
	window.requestAnimationFrame(tick)
}
window.requestAnimationFrame(tick)

function resize () {
	canvas.width = width = window.innerWidth
	canvas.height = height = window.innerHeight
	resizeGame()
}

window.addEventListener("resize", resize)
resize()

window.addEventListener("keydown", function (e) {
	setKey(e.keyCode, true)
})

window.addEventListener("keyup", function (e) {
	setKey(e.keyCode, false)
})

function setKey(keyCode, state) {
	var p0 = players[0]
	var p1 = players[1] ? players[1] : players[0]
	switch (keyCode) {
		case 37: p0.left = state
		  break
		case 38: p0.up = state
		  break
		case 39: p0.right = state
		  break
		case 40: p0.down = state
		  break
		 case 32: /*space */p0.shoot = state
		 	break
		case 65: p1.left = state
		  break
		case 87: p1.up = state
		  break
		case 68: p1.right = state
		  break
		case 83: p1.down = state
		  break
		 case 70: //f
		 case 16: /*shift */p1.shoot = state
		 	break
		case 72: //h
		 	if (state===true) showHelp = !showHelp
		 	break
		case 73: //i
		 	if (state===true) {
		 		highConstrast = !highConstrast
		 		var spriteOffset = highConstrast ? 2 : 0
		 		players.forEach(p => p.sprite = playerSprites[(p.index+spriteOffset) % playerSprites.length])
		 	}
		 	break		 
	}
}

///// Art stuff /////

var playerSprites = []
playerSprites.push({x:0, y:0, width:15, height: 15})
playerSprites.push({x:16, y:0, width:15, height: 15})
playerSprites.push({x:42, y:29, width:15, height: 15})
playerSprites.push({x:58, y:29, width:15, height: 15})

var shotSprite = {x:17, y:37, width:7, height: 7}
var rockSprite = []
rockSprite[0] = {x:0, y:54, width:40, height: 40}
rockSprite[1] = {x:0, y:16, width:20, height: 20}
rockSprite[2] = {x:0, y:37, width:16, height: 16}
//rockSprite[3] = {x:21, y:16, width:10, height: 10}

var prizeSprite = {x:27, y:28, width:14, height: 24}

var expSprites = []
expSprites.push({x:34, y:0, width:28, height: 28})
expSprites.push({x:64, y:1, width:12, height: 12})
expSprites.push({x:41, y:53, width:40, height: 40}) //player respawn effect

///// Game stuff /////

var scale = 1
var friction = 0.98
var shots = []
var rocks = []
var exps = []
var effects = []
var effectColor = ["purple","purple","purple","purple"]
effectColor[-1] = "white"
var shotLifetime = 30
var shotMass = 1
var prize = {
	pos:{x:0, y:0, angle:0},
	sprite:prizeSprite,
	radius:prizeSprite.height*scale/2,
	mass:20,
	vel: {x:0, y:0},
	alive: true
	}
teleportPrize()
var messageDisplayTime = 45
var scoreDisplayTime = 45
var endRoundTime = 60*10
var players = []
var defaultPlayerCount = 2
var playerRespawnClearRadius = 20
var playerCount = getPlayerCount()
for (var i = 0; i < playerCount; i++) {
	players.push(
	{
		pos:{x:200,y:300, angle:0},
		sprite:playerSprites[i],
		turnSpeed: 0.06,
		vel:{x:0,y:0},
		thrust:0.1,
		reload:0,
		reloadRate:15,
		shotForce:10,
		radius:playerSprites[i].width*scale/2-2,
		alive: true,
		mass: 3,/*lower mass but we are sloweds by friction*/
		deaths:0,
		score:0,
		oldScore:0,
		messages:[],
		index:i,
		spawnPoint:{x:0, y:0}
	})
}
players[0].spawnPoint.x = width / 4
players[0].spawnPoint.y = height / 2
if (players[1]) {
	players[1].spawnPoint.x = width * 3 / 4
	players[1].spawnPoint.y = height / 2	
}
if (players[2]) {
	players[2].spawnPoint.x = width / 4
	players[2].spawnPoint.y = height * 3 / 4
	players[0].spawnPoint.y = height / 4
}
if (players[3]) {
	players[3].spawnPoint.x = width * 3 / 4
	players[3].spawnPoint.y = height * 3 / 4
	players[1].spawnPoint.y = height / 4
}
players.forEach(p => {p.pos.x = p.spawnPoint.x; p.pos.y = p.spawnPoint.y})
var rockMass = [40, 20, 10]
var minRockDensity = 200*200;

var highConstrast = false;
var showHelp = false;
var gamepad = new Gamepad();

var scoreLimit = 100
var gameState = "playing"
var endMessage = ""
var endTimer = 0
var startTimerTime = 100
var startTimer = startTimerTime

addEdgeRock()
addEdgeRock()
addEdgeRock()

function tickGame() {
	update()
	draw()
}

function draw() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	players.forEach(function (p) {
		if (p.alive) drawSprite(p.pos, p.sprite)
	})
	shots.forEach(function (shot) {
		drawSprite(shot.pos, shotSprite)
	})
	rocks.forEach(function (rock) {
		drawSprite(rock.pos, rockSprite[rock.type])
	})

	drawHud()

	if (prize.alive) drawSprite(prize.pos, prize.sprite)
	exps.forEach(function (exp) {
		drawSprite(exp.pos, expSprites[exp.type])
	})
	effects.forEach(function (effect) {
		drawEffect(effect)
	})
	players.forEach(function (p) {
		if (p.messages.length > 0) {
			drawMessage(p, p.messages[0].text)
		}
		drawScore(p)
	})
}

function drawHud() {
	ctx.font = "30px monospace"
	ctx.textAlign = "left"
	ctx.fillStyle = "white"
	ctx.fillText("Score", 10, 40)
	var scoreString = players[0].score
	for(var i = 1; i < playerCount; i++) {
		scoreString += " vs " + players[i].score
	}
	ctx.fillText(scoreString, 10, 70)

	ctx.font = "20px monospace"
	if (showHelp) {
		ctx.fillText("Get 100 points to win", 10, 100)
		ctx.fillText("Player 1: Arrow keys + spacebar", 10, 120)
		ctx.fillText("Player 2: WASD + Shift (or F)", 10, 140)
		ctx.fillText("(no touchscreens sorry! but gamepads work!)", 10, 160)
		ctx.fillText("H - hide help text", 10, 180)
		ctx.fillText("I - toggle high contrast mode", 10, 200)
		ctx.fillText("Add ?p=4 to the URL for 4-player mode", 10, 220)
		ctx.fillText("(4-player mode requires 2 or more game controllers)", 10, 240)
	} else {
		ctx.fillText("H - show help", 10, 100)
	}

	if (startTimer > 0) {
		ctx.font = "50px monospace"
		ctx.textAlign = "center"
		ctx.fillStyle = "white"
		ctx.fillText("Get the gem!", width/2, height/2)		
	}

	if (endMessage != "") {
		ctx.font = "50px monospace"
		ctx.textAlign = "center"
		ctx.fillStyle = "white"
		ctx.fillText(endMessage, width/2, height/2)
	}
}

function update() {
	updatePlayers()
	updateShots()
	updateRocks()
	exps.forEach(function (exp) {
		exp.lifetime--
	})
	exps = exps.filter(e => e.lifetime > 0)

	effects.forEach(function (effect) {
		effect.lifetime--
	})
	effects = effects.filter(e => e.lifetime > 0)


	if (prize.alive) {
		prize.pos.angle += 0.02
		move(prize)
		wrap(prize.pos)
	} else {
		prize.respawnCounter--
		if (prize.respawnCounter <= 0) {
			teleportPrize()
		}
	}

	//asteroid density
	var area = width * height
	if (area / rocks.length > minRockDensity) {
		addEdgeRock()
	}

	if (gameState === "end") {
		endTimer++
		if (endTimer > endRoundTime) { //framerate dependent
			gameState = "playing"
			endMessage = ""
			endTimer = 0
			startTimer = startTimerTime
			players.forEach(p => {
				p.score = 0
				p.messages.length = 0
				respawn(p)
			})
		}
	}
}

function respawn(player) {
	player.alive = true
	player.pos.x = player.spawnPoint.x
	player.pos.y = player.spawnPoint.y
	player.vel.x = 0
	player.vel.y = 0
	player.pos.angle = angleTo(player.pos, prize.pos)
	addEffect(player.pos, player.index)
	play("respawn")
	destroyRocksNearPoint(player.pos)
}

function updatePlayers() {
	doGamepad()
	players.forEach(function (player) {
	
		if (!player.alive) {
			player.respawnCounter--
			if (player.respawnCounter <= 0) {
				respawn(player)
			}
		} else
		{

			if (player.left) {
				turn(player.pos, -player.turnSpeed )
			}
			if (player.right) {
				turn(player.pos, player.turnSpeed)
			}
			if (player.up) {
				applyForce(player.vel, player.pos.angle, player.thrust)
			}
			player.vel.x *= friction
			player.vel.y *= friction
			if (player.shoot && player.reload === 0) {
				player.reload = player.reloadRate
				var shot = {
				  pos:{x:player.pos.x,y:player.pos.y, angle:0},
				  vel:{x:player.vel.x,y:player.vel.y},
				  lifetime:shotLifetime,
				  radius:shotSprite.width/2*scale
				}
				moveInDirection(shot.pos, player.pos.angle, player.radius + shot.radius)
				applyForce(shot.vel, player.pos.angle, player.shotForce)
				play("shoot")
				shots.push(shot)
			}
			if (player.reload > 0) {
				player.reload--
			}

			var myRock = collideList(player, rocks)
			if (myRock) {
				impactRock(myRock, player.vel, player.mass)
				explodePlayer(player)
			}

			if (collides(prize, player)) {
				addScore(player, 10)
				destroyPrize()
			}

			var myHitFriend = collideList(player, players)
			if (myHitFriend) {
				explodePlayer(player)
				explodePlayer(myHitFriend)
				//hack: move them apart so their score displays don't overlap
				var angle = angleTo(player.pos, myHitFriend.pos)
				moveInDirection(player.pos, angle, -54)
				moveInDirection(myHitFriend.pos, angle, 54)
			}

			move(player)
			wrap(player.pos)
		}

		if (startTimer > 0) {
			startTimer--
		}

		if (gameState === "playing" && player.score >= scoreLimit) {
			gameState = "end"
			endMessage = "Game Over"
			players.forEach(p => {
				if (p != player) addMessage(p, "Nice try", endRoundTime)
			})
			addMessage(player, "Winner!", endRoundTime)
		}

		if (player.messages.length > 0) {
			player.messages[0].age--
			if (player.messages[0].age <= 0) {
				player.messages.shift()
			}
		}

	});
}

function doGamepad()
{
	gamepad.update()
	gamepad.getEvents().forEach(e => {
		players[playerCount-1-e.i][e.key] = e.state
	})
}

function explodePlayer(player)
{
	if (!player.alive) return;
	play("playerExplode")
	player.alive = false
	player.deaths++
	player.respawnCounter = 60
	addExplosion(player.pos, 0)
	addScore(player, -1)
}

function addScore(player, amount)
{
	if (gameState === "end") return //no scoring on end screen
	player.oldScore = player.score
	player.score += amount
	if (player.score > 100) player.score = 100
	if (player.score < 0) player.score = 0
	player.scoreDisplayTimer = scoreDisplayTime
	player.scoreWasGood = (amount >= 0)
}

function addMessage(player, messageString, timer)
{
	player.messages.push({text:messageString, life:timer})
}

function destroyPrize() {
	prize.respawnCounter = 45
	prize.alive = false
	play("pickup")
	play("score")
}

function teleportPrize() {
	prize.alive = true
	prize.pos.x = Math.random() * width
	prize.pos.y = Math.random() * height
	prize.vel.x = 0
	prize.vel.y = 0
	addEffect(prize.pos, -1)
	applyForce(prize.vel, Math.random() * Math.PI * 2, 1)
	play("respawn")
}


function updateShots() {
	shots.forEach(function (shot) {
		shot.lifetime--
		move(shot)
		wrap(shot.pos)
		var myRock = collideList(shot, rocks)
		if (myRock) {
			transferVel(myRock.vel, shot.vel, shotMass / myRock.mass)
			shot.lifetime = 0
			addExplosion(shot.pos, 1)
			play("hitRock") //2 is ok, 3 is ok
		}
		var myP = collideList(shot, players)
		if (myP) {
			transferVel(myP.vel, shot.vel, shotMass / myP.mass)
			shot.lifetime = 0
			addExplosion(shot.pos, 1)
			play("playerHit")
		}
		if (collides(prize, shot)) {
			transferVel(prize.vel, shot.vel, shotMass / prize.mass)
			shot.lifetime = 0
			addExplosion(shot.pos, 1)
			play("hitPrize")
		}
	})
	shots = shots.filter(s => s.lifetime > 0)
}

function updateRocks() {
	rocks.forEach(function (rock) {
		move(rock)
		wrap(rock.pos)
	})
	rocks = rocks.filter(s => s.alive)
}

function addEdgeRock() {
	if (Math.random() > 0.5) {
		var x = 0
		var y = Math.random() * height
	} else {
		var x = Math.random() * width
		var y = 0
	}
	var rock = addRock(x, y, Math.random() < 0.5 ? 0 : 1)
}

function addRock(x, y, type) {
	var rock = {
		pos:{x:x,y:y, angle:0},
	  vel:{x:0,y:0},
	  alive:true,
	  type:type,
	  mass:rockMass[type],
	  radius:rockSprite[type].width/2*scale
	}
	applyForce(rock.vel, randomAngle(), (type*0.125+0.25))
	rocks.push(rock)
	return rock
}

function impactRock(rock, expVel, mass) {
	addExplosion(rock.pos, 0)
	transferVel(rock.vel, expVel, mass / rock.mass)
	/*if (rock.type < 2) {
		for (var i = 0; i < 2; i++) {
			var lilRock = addRock(
				rock.pos.x,
				rock.pos.y,
				rock.type + 1)
			transferVel(rock.vel, lilRock.vel, 1)
		}
	}
	rock.alive = false*/
}

function destroyRock(rock) {
	addExplosion(rock.pos, 0)
	rock.alive = false
}

function addExplosion(pos, type) {
	exps.push({ pos:{x:pos.x, y:pos.y},
		lifetime:10 + (type == 0) ? 5:0, type:type})
}

function addEffect(pos, type) {
	effects.push({ pos:{x:pos.x, y:pos.y},
		lifetime:40, type:type})
}

function collideList(me, list) {
 return list.find(you => collides(you, me))
}

function collides(you, me) {
	var dist = distance(you.pos, me.pos)
	return dist < you.radius + me.radius && you != me && you.alive != false
}

function distance(pos1, pos2) {
	var a = pos1.x - pos2.x
	var b = pos1.y - pos2.y
	return Math.sqrt(a * a + b * b)
}
function transferVel(velOut, velIn, factor) {
	velOut.x += velIn.x * factor
	velOut.y += velIn.y * factor
}

function randomAngle() {
	return Math.random() * Math.PI * 2
}

function angleTo(from, to)
{
	return Math.atan2(to.y - from.y, to.x - from.x)
}

function wrap(pos) {
	while (pos.x >= width) pos.x -= width
	while (pos.y >= height) pos.y -= height
	while (pos.x < 0) pos.x += width
	while (pos.y < 0) pos.y += height
}

function move(ent) {
	ent.pos.x += ent.vel.x
	ent.pos.y += ent.vel.y
}

function turn(pos, speed) {
	pos.angle += speed
	while (pos.angle >= Math.PI * 2) pos.angle -= Math.PI * 2
	while (pos.angle < 0) pos.angle += Math.PI * 2
}

function moveInDirection(pos, angle, distance) {
	pos.x += Math.cos(angle) * distance
	pos.y += Math.sin(angle) * distance
}

function applyForce(vel, angle, thrust) {
	vel.x += Math.cos(angle) * thrust
	vel.y += Math.sin(angle) * thrust
}

function resizeGame() {

}

function drawEffect(effect) {
	ctx.strokeStyle = effectColor[effect.type]
	ctx.beginPath()
	var widthMulti = (effect.type == -1) ? 2: 1
	ctx.lineWidth = (effect.lifetime / 16 * widthMulti)
	ctx.moveTo(effect.pos.x, 0)
	ctx.lineTo(effect.pos.x, height)
	ctx.moveTo(0, effect.pos.y)
	ctx.lineTo(width, effect.pos.y)
	ctx.stroke()
}

function getPlayerCount() {
	var pCount = parseInt(getQueryVariable("p"))
	if (pCount > 0 && pCount <= 4) return pCount
	return defaultPlayerCount
}

function destroyRocksNearPoint(pos) {
	addExplosion(pos, 2)
	var explosion = {pos:pos, radius:playerRespawnClearRadius}
	rocks.forEach(function (rock) {
		if (collides(explosion, rock)) {
			destroyRock(rock)
		}
	})
}

//Utilities
function getQueryVariable(variable)
{
   var query = window.location.search.substring(1)
   var vars = query.split("&")
   for (var i=0;i<vars.length;i++) {
           var pair = vars[i].split("=")
           if(pair[0] == variable){return pair[1]}
   }
   return(false)
}

function drawMessage(ent, text) {
	ctx.font = "40px monospace"
	ctx.textAlign = "center"
	ctx.fillText(text, ent.pos.x, ent.pos.y - ent.radius - 64)
}

function drawScore(ent) {
	if (ent.scoreDisplayTimer > 0 || gameState === "end") {
		ent.scoreDisplayTimer--
		var radius = ent.radius + 50
		var arc = ent.oldScore * (Math.PI * 2) / scoreLimit
		if (arc < 0) arc = 0
		var start = Math.PI/2
		ctx.beginPath()
		ctx.strokeStyle = "rgba(255, 255, 255, 0.1)"
		ctx.lineWidth = 5
		ctx.arc(ent.pos.x, ent.pos.y, radius, 0, Math.PI*2, false)
		ctx.stroke()

		ctx.beginPath()
		ctx.strokeStyle = "white"
		ctx.arc(ent.pos.x, ent.pos.y, radius, start, start+arc, false)
		ctx.stroke()

		ctx.fillStyle = (ent.scoreWasGood) ? "white" : "red"
		if (ent.oldScore < ent.score) ent.oldScore++
		if (ent.oldScore > ent.score && ent.scoreDisplayTimer < scoreDisplayTime - 8) ent.oldScore--
		ctx.font = "40px monospace"
		ctx.textAlign = "center"
		ctx.fillText(ent.oldScore, ent.pos.x, ent.pos.y - ent.radius - 10)
	}
}

function drawSprite(pos, sprite) {
	ctx.translate(pos.x, pos.y)
	ctx.rotate(pos.angle)
	ctx.drawImage(spriteImage,
		sprite.x, sprite.y,
		sprite.width, sprite.height,
	  -sprite.width*scale/2, -sprite.height*scale/2,
	  sprite.width*scale, sprite.height*scale)
	ctx.rotate(-pos.angle)
	ctx.translate(-pos.x, -pos.y)
}
