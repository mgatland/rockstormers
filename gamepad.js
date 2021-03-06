function Gamepad() {
    var deadZone = 0.5
    var oldLeft = []
    var oldRight = []
    var oldUp = []
    var oldDown = []
    var oldShoot = []
    var downFunc, upFunc
    var events = []

    function simulateKey(newState, oldState, i, key)
    {
        if (newState != oldState[i]) {
            events.push({key:key, i:i, state:newState})
        }
    }

    function updateGamepad (gamepad, i) {
        if (!gamepad) return

        function getButton (num) {
            return (gamepad.buttons.length > num && gamepad.buttons[num].pressed)
        }

        var left = gamepad.axes[0] < -deadZone
        var right = gamepad.axes[0] > deadZone
        var up = getButton(0) || getButton(6)
        var shoot = getButton(2)|| getButton(7)
        var down = false

        simulateKey(left, oldLeft, i, "left")
        simulateKey(right, oldRight, i, "right")
        simulateKey(up, oldUp, i, "up")
        simulateKey(down, oldDown, i, "down")
        simulateKey(shoot, oldShoot, i, "shoot")
        oldLeft[i] = left
        oldRight[i] = right
        oldUp[i] = up
        oldDown[i] = down
        oldShoot[i] = shoot
    }

    this.getEvents = function () { return events }

    this.update = function update () {
        events.length = 0
        if (!navigator.getGamepads) return
        var gamepads = navigator.getGamepads()
        for (var i = 0; i < gamepads.length; i++) {
            updateGamepad(gamepads[i], i)
        }
    }
}
