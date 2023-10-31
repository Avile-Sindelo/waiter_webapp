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

    //validate the username
    if(waitersFactory.validName(username)){
        messages.success = `${username} successfully added to the waiters list`;
        messages.error = '';


        if(duplicateCondition){ //Already exists
    
            messages.error = 'Waiter is already recorded in the system';
            messages.success = '';
            //retrieve the days that were selected in the last session
            let days = await database.getWaiterDays(username);
     
            waitersFactory.checkWaiterDays(days, daysOfTheWeek)
    
            res.render('select_days', {username: username, error: messages.error, succes:messages.success, days, daysOfTheWeek});
        } else { //New waiter
          
            //clear previous messages
            messages.error = '';
            messages.success = '';
            // add the new waiter to the Waiters table
            await database.addWaiter(username);
            //render the view that allows for day selection
            res.render('select_days', {username: username, error: messages.error, succes:messages.success, daysOfTheWeek});
        }

    } else {
        //invalid name
        messages.error = 'Please make sure you enter a valid name';
        messages.success = '';

        res.render('index', {invalidName: messages.error});
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

        waitersFactory.checkWaiterDays(days, daysOfTheWeek);

        res.render('select_days', {username: username.username, success: messages.success, error: messages.error, daysOfTheWeek})
    } else if(days.length > 5){
        messages.error = 'You cannot select more than 5 days';
        messages.success = '';

        //retrieve the days that were selected in the last session
        let days = await database.getWaiterDays(username.username);
         
        waitersFactory.checkWaiterDays(days, daysOfTheWeek);

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

    //get the waiters available for the week - needed by the Shift-waiter functionality
    let waitersAvailable = await database.getAvailableWaiters(); 

    res.render('admin', {days: await getDataStructure(week), week, waitersAvailable});
});

app.post('/admin', async function(req, res){
    let waiterName = req.body.waiter;
    let oldDay = req.body.oldDay;
    let newDay = req.body.newDay;

    //delete later - refactor to a function
    let week = await database.getWeekdays(); 

    //Make sure values were passed in
    if(waiterName == undefined || oldDay == undefined || newDay == undefined){
        messages.error = 'Please select a waiter, a day from which to move, and a day to move to';
        messages.success = '';

         //get the waiters available for the week - needed by the Shift-waiter functionality
         let waitersAvailable = await database.getAvailableWaiters(); 
        
         res.render('admin', {days: await getDataStructure(week) ,  success: messages.success, error: messages.error, week, waitersAvailable});

    } else {

        //get the waiter ID
        let waiterID = await database.getWaiterId(waiterName);
        //get the old day ID
        let oldDayID = await database.getDayId(oldDay);
        //get the new day ID
        let newDayID = await database.getDayId(newDay);
        //get the waiter's days
        let waiterDays = await database.getWaiterDays(waiterName);
    
        if(oldDay == newDay){
            messages.error = 'Please make sure you move a waiter between different days';
            messages.success = '';
            
           
        } else if(!(waiterDays.includes(oldDay)) || waiterDays.includes(newDay)){
            messages.error = 'Please make sure to move the waiter from a valid day';
            messages.success = '';
      
          
        } else {
            await database.moveWaiterToNewDay(waiterID.id, oldDayID.id, newDayID.id);
            messages.success = `${waiterName} successfully moved from ${oldDay} to ${newDay}`;
            messages.error = '';  
    
        }
                

        //get the waiters available for the week - needed by the Shift-waiter functionality
        let waitersAvailable = await database.getAvailableWaiters(); 
        
        res.render('admin', {days: await getDataStructure(week) ,  success: messages.success, error: messages.error, week, waitersAvailable});
    }
    

});

async function getDataStructure(week){
    let dataStructure = []; 
     
        //loop over the days  
        for(let i = 0; i < week.length; i++){
           
            //get the waiters available for each day
            let today = week[i].day;
            let dayWaiters = [];
            
            let dbWaiters = await database.waitersAvailableToday(today); 
            dbWaiters.forEach(waiter => {
                dayWaiters.push(waiter.name);
            });
            
            let dayData = waitersFactory.getAdminDay(today, dayWaiters);
            //populate the data structure with the return day data
            dataStructure.push(dayData);
        }

        return dataStructure;
}

app.post('/reset', async function(req, res){
    let week = await database.getWeekdays();
    //reset the database
    await database.resetApp();
    messages.error = '';
    messages.success = 'All waiter records have been deleted.';        
    //redirect to the admin view
    res.render('admin', {days: await getDataStructure(week), success: messages.success, error: messages.error})
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, function(){
    console.log(`Server running at port : ${PORT}`)
})