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
import Routes from "./routes.js";

const app = express();
const connectionString = process.env.DATABASE_URL || 'postgres://kxtscboh:BuTUiYZKVdaTcmuaEy6zPR_oUwHiXgh1@silly.db.elephantsql.com/kxtscboh?ssl=true';
const postgresP = pgp();
const db = postgresP(connectionString);
const database = Database(db);
const waitersFactory = Waiters();
const routes = Routes(waitersFactory, database);

app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', 'views');

app.use(express.static('public'));

app.use(bodyParser.urlencoded({ extended: false }))

app.get('/', routes.renderIndex)

app.get('/waiters/:username', routes.takeNameFromRoute);

// app.post('/waiters', routes.takeNameFromInput);

app.post('/waiters/:username', routes.postWaiterDays);


app.get('/days', routes.handleAdmin);

app.post('/days', routes.changeWaiterSchedule);

app.post('/reset', routes.handleReset);

const PORT = process.env.PORT || 5000;
app.listen(PORT, function(){
    console.log(`Server running at port : ${PORT}`)
})