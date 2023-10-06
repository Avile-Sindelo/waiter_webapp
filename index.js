// PSUEDOCODE!!!

import express from "express";
import { engine } from "express-handlebars";
import bodyParser from "body-parser";
import pgp from "pg-promise";

const app = express();
const connectionString = process.env.DATABASE_URL || 'postgres://kxtscboh:BuTUiYZKVdaTcmuaEy6zPR_oUwHiXgh1@silly.db.elephantsql.com/kxtscboh?ssl=true';
const postgresP = pgp();
const db = postgresP(connectionString);
console.log('Database instance', db)

app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', 'views');

app.use(bodyParser.urlencoded({ extended: false }))

app.get('/', function(req, res){
    res.render('index');
})

app.get('/waiters/:username', function(req, res){
    console.log(req.params.username);
    let username = req.params.username;

    //if the username is already in the database
        //retrieve the day the selected the previous they were logged in
    //else,
        //populate the Waiters table with the new username and show them the screen to select days


    res.render('select_days', {username: username});
});

app.post('/waiters/:username', function(req, res){
    //Retrieve the selected days from the selection screen
    let selected_days = req.body;
    console.log(selected_days);
    res.redirect('/');
    //Populate the Shifts table using the username parameter to query that database
});

// app.post('/waiter_reg/', function(req, res){
//     console.log(req.body.username);
//     let username =  req.body.username;
//     res.render('select_days', {username: username});
// })

const PORT = process.env.PORT || 5000;
app.listen(PORT, function(){
    console.log(`Server running at port : ${PORT}`)
})