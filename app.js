import express from 'express'
import mysql from 'mysql'
import bcrypt from 'bcrypt'
import session from 'express-session'

const app = express()
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'job_board_db'
})

app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(express.urlencoded({extended: false}))
app.use(session({
    resave: false,
    saveUninitialized: false,
    secret: '#ikokazi' 
}))

// continually check if user is logged in
app.use((req, res, next) => {
    if (req.session.userID === undefined) {
        res.locals.isLoggedIn = false
        // console.log('user is not logged in')        
    } else {
        res.locals.isLoggedIn = true
        // console.log(`user is logged in with id: ${req.session.userID}` )
    }
    next()
})


app.get('/', (req, res) => {
    res.render('index')
})

app.get('/board', (req, res) => {
    if (res.locals.isLoggedIn) {
        res.render('board')
    } else {
        res.redirect('/login')
    }
})

// login 
app.get('/login', (req, res) => {
    const user = {
        email: '', 
        password: ''
    }
    res.render('login', {error: false, user: user})
})

app.post('/login', (req, res) => {
    const user = {
        email: req.body.email,
        password: req.body.password
    }

    let sql = 'SELECT * FROM job_seekers WHERE email = ?'
    connection.query(
        sql, [user.email], (error, results) => {
            if (results.length > 0) {

                bcrypt.compare(user.password, results[0].password, (error, matches) => {
                    if (matches) {
                        req.session.userID = results[0].js_id
                        res.redirect('/board')                        
                    } else {
                        let message = 'Incorrect password'
                        res.render('login', {error: true, message: message, user: user})
                    }
                })
                
            } else {
                let message = 'Account does not exist. Please create one.'
                res.render('login', {error: true, message: message, user: user})                
            }
        }
    )

})

// sign up
app.get('/signup', (req, res) => {
    const user = {
        fullname: '',
        email: '',
        password: '',
        confirmPassword: ''
    }
    res.render('signup', {error: false, user: user})
})

app.post('/signup', (req, res) => {
    const user = {
        fullname: req.body.fullname,
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword
    }

    if (user.password === user.confirmPassword) {

        let sql = 'SELECT * FROM job_seekers WHERE email = ?'
        connection.query(
            sql, [user.email], (error, results) => {
                if (results.length > 0) {
                    let message = 'Account already exists with the email provided.'
                    res.render('signup', {error: true, message: message, user: user})
                } else {

                    bcrypt.hash(user.password, 10, (error, hash) => {
                        let sql = 'INSERT INTO job_seekers (fullname, email, password) VALUES (?,?,?)'
                        connection.query(
                            sql, 
                            [
                                user.fullname,
                                user.email,
                                hash
                            ],
                            (error, results) => {
                                res.redirect('/login')
                            }
                        )
                    })
                    
                }
            }
        )
        
    } else {
        let message = 'Passwords not matching.'
        res.render('signup', {error: true, message: message, user: user})
    }
})

// logout functionality
app.get('/logout', (req, res) => {
    req.session.destroy((error) => {
        res.redirect('/')
    })
})


const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log('server is up. application running...')
})