// PSUEDOCODE!!!
/**
 * Imports
 * 
 * create the app using express
 * get the database connection string from ElephantSQL
 * instantiate pg-promise and wrap it around that connection string
 * instatiate the Database factory function
 * 
 * configure the view engine
 * configure body-parser
 * use the public folder for styling (static files)
 * 
 * create the Home route - GET
 *      render the 'index' of handlebars from the response object
 * 
 * create the '/waiters/:username route - GET
 *      if the username is already in the WAITERS table
 *          retrive the days from the SHIFTS table 
 *          render the "select_days" screen with the returned days already checked
 *      else, 
 *          add the new username to the Waiters table
 *          render the "select_days" view with unchecked days 
 * 
 * create the '/waiters/:username' route - POST
 *      if 0 > DAYS SELECTED > 3
 *          populate the error message
 *          render/redirect to the "select_days" view, carrying that error message
 *      else, 
 *          get the values of the selected days from the request 
 *          retrieve the waiter id and IDs for the selected days
 *          populate the SHIFTS table 
 *          render a "selected_days" views displaying the chosen days
 * 
 * create the '/days' route - GET
 *      render the view displaying all the days that the waiter is available for work
 */

import express from "express";
import { engine } from "express-handlebars";
import bodyParser from "body-parser";
import pgp from "pg-promise";
import Database from "./database/database.js";
import Waiters from "./waiters.js";

const app = express();
const connectionString = process.env.DATABASE_URL || 'postgres://kxtscboh:BuTUiYZKVdaTcmuaEy6zPR_oUwHiXgh1@silly.db.elephantsql.com/kxtscboh?ssl=true';
const postgresP = pgp();
const db = postgresP(connectionString);
const database = Database(db);
const waitersFactory = Waiters();

let messages = {
    error: '',
    success: ''
}

app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', 'views');

app.use(express.static('public'));

app.use(bodyParser.urlencoded({ extended: false }))

app.get('/', function(req, res){
    res.render('index');
})

app.get('/waiters/:username', async function(req, res){
    let username = req.params.username;
    let duplicateCondition = await database.waiterAlreadyExists(username);
    let daysOfTheWeek = await database.getWeekdays();

    if(duplicateCondition){ //Already exists
        console.log('This is the duplicate : ',  duplicateCondition);
        messages.error = 'Waiter is already recorded in the system';
        messages.success = '';
        //retrieve the days that were selected in the last session
        let days = await database.getWaiterDays(username);
 
        await waitersFactory.checkWaiterDays(days, daysOfTheWeek)

        res.render('select_days', {username: username, error: messages.error, succes:messages.success, days, daysOfTheWeek});
    } else { //New waiter
        console.log('This is NOT a duplicate : ', duplicateCondition);
        //clear previous messages
        messages.error = '';
        messages.success = '';
        // add the new waiter to the Waiters table
        await database.addWaiter(username);
        //render the view that allows for day selection
        res.render('select_days', {username: username, error: messages.error, succes:messages.success, daysOfTheWeek});
    }
});

app.post('/waiters/:username', async function(req, res){
    //Retrieve the selected days from the selection screen
    let selected_days = req.body;
    let days = selected_days.days;
    let username = req.params;
    let daysOfTheWeek = await database.getWeekdays();

    
   if(days.length < 3){
        messages.error = 'You cannot select less than 3 days';
        messages.success = '';

        //retrieve the days that were selected in the last session
        let days = await database.getWaiterDays(username.username);

        await waitersFactory.checkWaiterDays(days, daysOfTheWeek);

        res.render('select_days', {username: username.username, success: messages.success, error: messages.error, daysOfTheWeek})
    } else if(days.length > 5){
        messages.error = 'You cannot select more than 5 days';
        messages.success = '';

        //retrieve the days that were selected in the last session
        let days = await database.getWaiterDays(username.username);
         
        await waitersFactory.checkWaiterDays(days, daysOfTheWeek);

        res.render('select_days', {username: username.username, success: messages.success, error: messages.error, daysOfTheWeek})
    }else {
       //Check if the waiter is a duplicate
       let duplicate = await database.waiterAlreadyExists(username.username);
       let waiterID = await database.getWaiterId(username.username);
       
       if(duplicate){
            await database.updateShift(waiterID.id, days);
       } else {
            await database.addShift(waiterID.id, days);
       }
               
       res.render('chosen_days', {days, username: username.username})
    }
    
});

app.get('/admin', async function(req, res){
    //get the weekdays from the database
    let week = await database.getWeekdays();
    let dbWaiters;
    
    let myArr = [];

    // console.log(week);
    //loop over the days  
    for(let i = 0; i < week.length; i++){
        let data = {
            day: ''
        };
        //get the waiters available for each day
        let today = week[i].day;
        let myWaiters = [];
        data.day = today;
        dbWaiters = await database.waitersAvailableToday(today);
        dbWaiters.forEach(waiter => {
            myWaiters.push(waiter.name);
        });
        
        data.waiters = myWaiters;
        if(myWaiters.length == 1){
            //red
            data.bgColor = 'crimson';
        } else if(myWaiters.length < 3 && myWaiters.length > 1){
            //under subscribed
            data.bgColor = 'orange';
        } else if(myWaiters.length == 3){
            //perfect
            data.bgColor = 'green';
        } else if(myWaiters.length > 3){
            //Over subscribed
            data.bgColor = 'purple';
        }
        myArr.push(data);
    }

    let waitersAvailable = await database.getAvailableWaiters();

    res.render('admin', {days: myArr, week, waitersAvailable});
});

app.post('/admin/movewaiter/', async function(req, res){
    console.log('Selected waiter :', req.body.waiter);
    console.log('New day :', req.body.newDay);
    let waiterName = req.body.waiter;
    let newDay = req.body.newDay;
    res.render('admin');
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