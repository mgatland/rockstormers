function Gamepad() {
    var deadZone = 0.5
    var oldLeft, oldRight, oldUp, oldDown, oldShoot
    var downFunc, upFunc
    var events = []

    function simulateKey(newState, oldState, i, key)
    {
        if (newState != oldState) {
            events.push({key:key, i:i, state:newState})
            console.log(events[events.length-1])
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
        oldLeft = left
        oldRight = right
        oldUp = up
        oldDown = down
        oldShoot = shoot
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
