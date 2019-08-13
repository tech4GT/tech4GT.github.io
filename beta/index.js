const canvas = document.querySelector("canvas")
canvas.width = window.innerWidth
canvas.height = window.innerHeight

const c = canvas.getContext('2d')
const colors = ['#3a1f5d', '#c83660', '#e15249', '#f6d365']



class Circle {
    constructor(x, y, r, vX, vY) {
        this.x = x
        this.y = y
        this.r = r
        this.vX = vX
        this.vY = vY
        this.color = colors[Math.round(Math.random() * 3)]
    }

    draw() {
        if (this.x + this.r >= canvas.width || this.x - this.r <= 0) {
            this.vX *= -1
        }
        if (this.y + this.r >= canvas.height || this.y - this.r <= 0) {
            this.vY *= -1
        }

        this.x += this.vX
        this.y += this.vY

        c.beginPath();
        c.strokeStyle = this.color
        c.arc(this.x, this.y, this.r, 0, 2 * Math.PI);
        c.stroke()
        c.fillStyle = this.color
        c.fill()
    }
}
class Square {
    constructor(x, y, w, h, vX, vY) {
        this.x = x
        this.y = y
        this.w = w
        this.h = h
        this.vX = vX
        this.vY = vY
        this.color = colors[Math.round(Math.random() * 10)]
    }

    draw() {
        if (this.x >= window.innerWidth || this.x <= 0) {
            // console.log("Out of bounds!")
            // console.log(this.x + "-" + this.y)
            this.vX *= -1
        }
        if (this.y >= canvas.height || this.y <= 0) {
            // console.log("Out of bounds!")
            // console.log(this.x + "-" + this.y)
            this.vY *= -1
        }
        this.x += this.vX
        this.y += this.vY
        c.fillStyle = this.color
        c.fillRect(this.x, this.y, this.w, this.h)
    }

}


const cls = []
let i = 500
while (i-- > 0)
    cls.push(new Circle(Math.random() * canvas.width, Math.random() * canvas.height, 3, (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3, false))




document.addEventListener('mousemove', event => {

    for (let cl of cls) {
        if (Math.abs(event.clientX - cl.x) < 50 && Math.abs(event.clientY - cl.y) < 50 && cl.r < 80) {
            cl.r += 10
        } else if (cl.r > 3) {
            cl.r -= 1
        }
    }
})

function animate() {
    // console.log("Animating!")
    c.clearRect(0, 0, canvas.width, canvas.height)
    for (let cl of cls)
        cl.draw()
    window.requestAnimationFrame(animate)
}

animate()
