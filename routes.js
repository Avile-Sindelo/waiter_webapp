import bcrypt from 'bcrypt';

export default function Routes(waitersFactory, database){

    let messages = {
        error: '',
        success: ''
    }
    
    function renderIndex(req, res){
        
        res.render('index');
        
    }

   async function addWaiterFromRoute(req, res){
            let username = req.params.username;
            let capitalName = waitersFactory.capitalizeName(username)
            let days = await database.getWaiterDays(capitalName);
            let daysOfTheWeek = await database.getWeekdays();
            
            let duplicateCondition = await database.waiterAlreadyExists(capitalName);
          
        
            //validate the username
            if(waitersFactory.validName(capitalName)){
                messages.success = `${capitalName} successfully added to the waiters list`;
                messages.error = '';
        
        
                if(duplicateCondition){ //Already exists
            
                    messages.error = 'Waiter is already recorded in the system';
                    messages.success = '';
                    //retrieve the days that were selected in the last session
                    let days = await database.getWaiterDays(capitalName);
             
                    waitersFactory.checkWaiterDays(days, daysOfTheWeek)
                    res.render('select_days', {username: capitalName, error: messages.error, succes:messages.success, days, daysOfTheWeek});
                    
                } else { //New waiter
                  
                    //clear previous messages
                    messages.error = '';
                    messages.success = '';
                    // add the new waiter to the Waiters table
                    await database.addWaiter(capitalName);
                    res.render('select_days', {username: capitalName, error: messages.error, succes:messages.success, daysOfTheWeek});
                }
        
            } else {
                //invalid name
                messages.error = 'Please make sure you enter a valid name';
                messages.success = '';
        
        
                res.render('index', {invalidName: messages.error});
            }   
    }

    /* async function takeNameFromInput(req, res){
            //extract the waiter name from the request object
            let { name, email, password, confirmedPassword } = req.body;
            let usernameUppercase = waitersFactory.capitalizeName(name);
        
            let days = await database.getWaiterDays(usernameUppercase);
            let daysOfTheWeek = await database.getWeekdays();
            
            let duplicateCondition = await database.waiterAlreadyExists(usernameUppercase);
        
            //validate the username
            if(waitersFactory.validName(usernameUppercase)){
                messages.success = `${usernameUppercase} successfully added to the waiters list`;
                messages.error = '';
        
        
                if(duplicateCondition){ //Already exists
            
                    messages.error = 'Waiter is already recorded in the system';
                    messages.success = '';
                    //retrieve the days that were selected in the last session
                    let days = await database.getWaiterDays(usernameUppercase);
             
                    waitersFactory.checkWaiterDays(days, daysOfTheWeek)
            
                    
                } else { //New waiter
                  
                    //clear previous messages
                    messages.error = '';
                    messages.success = '';
                    // add the new waiter to the Waiters table
                    await database.addWaiter(usernameUppercase);
                    
                }
        
            } else {
                //invalid name
                messages.error = 'Please make sure you enter a valid name';
                messages.success = '';
        
        
                res.render('index', {invalidName: messages.error});
            }
        
            if(await database.waiterAlreadyExists(usernameUppercase)){
                waitersFactory.checkWaiterDays(days, daysOfTheWeek)
                res.render('select_days', {username: usernameUppercase, error: messages.error, succes:messages.success, days, daysOfTheWeek});
            } else {
                //paste
                //render the view that allows for day selection
                res.render('select_days', {username: usernameUppercase, error: messages.error, succes:messages.success, daysOfTheWeek});
            }    
            
        
    } */

   async function postWaiterDays(req, res){
            //Retrieve the selected days from the selection screen
            let selected_days = req.body;
            let days = selected_days.days;
            let username = req.params;
            let daysOfTheWeek = await database.getWeekdays();
        
            if(days == undefined){
                messages.error = 'Please make sure you select some days';
                messages.success = '';
        
                //retrieve the days that were selected in the last session
                let days = await database.getWaiterDays(username.username);
        
                waitersFactory.checkWaiterDays(days, daysOfTheWeek);
        
                res.render('select_days', {username: username.username, success: messages.success, error: messages.error, daysOfTheWeek})
            } else if(days.length < 3){
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
        
    }

    async function handleAdmin(req, res){
        //get the weekdays from the database
        let week = await database.getWeekdays();

        //get the waiters available for the week - needed by the Shift-waiter functionality
        let waitersAvailable = await database.getAvailableWaiters(); 

        res.render('admin', {days: await getDataStructure(week), week, waitersAvailable});

    }

    async function changeWaiterSchedule(req, res){
        let waiterName = req.body.waiter;
        let oldDay = req.body.oldDay;
        let newDay = req.body.newDay;
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
    

    }

    async function handleReset(req, res){
        let week = await database.getWeekdays();
        //reset the database
        await database.resetApp();
        messages.error = '';
        messages.success = 'All waiter records have been deleted.';        
        //redirect to the admin view
        res.render('admin', {days: await getDataStructure(week), success: messages.success, error: messages.error})
    
    }


    //No need to expose this one - used locally
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

    async function handleRegister(req, res){
        const { name, password, confirmPassword, email } = req.body;
        let hashedPassword = '';
        
        console.log('name: ', name);
        console.log('Email: ', email);
        console.log('Password: ', password);
        console.log('confirmed Password: ', confirmPassword);

        //Verify the values & encrypt the password

        
        //passwords don't match 
        if(password != confirmPassword){
            //error 
            messages.error = 'Passwords do not match!!!';
            messages.success = '';
            console.log(messages);

            res.render('index', {error: messages.error, succes: messages.success});            
        } else { //passwords DO match
            //encrypt the password
            
            // Generate a salt
            const saltRounds = 10;
            
            // Asynchronous function to hash the password
            const hashPassword = async () => {
                try {
                    // Generate a salt
                    const salt = await bcrypt.genSalt(saltRounds);

                    // Hash the password with the generated salt
                    hashedPassword = await bcrypt.hash(password, salt);

                    // Store hashedPassword in the database or wherever you need to store it
                    console.log('Hashed password:', hashedPassword);
                    messages.success = 'Registration successful';
                    messages.error = '';
                } catch (error) {
                    console.error('Error:', error);
                }
            };

            await hashPassword();
            
            //Populate the database
            await database.addWaiter(name, email, hashedPassword);
            
            //Render a view for to the login screen 
            res.render('register', {username: name, error: messages.error, success: messages.success});
        }

        
        // res.render('index', {error: messages.error, succes: messages.success});
    } 
    
    async function handleLogin(req, res){
        const { email, password } = req.body;

        // retrieve that name value from that view
        const name = await database.getWaiterName(email);
        if(name){
            console.log(name.name);
            console.log('Log name: ', name);
            console.log('Log email: ', email);
            console.log('Log password: ', password);
            
            //Get the list of users from the database
            //check for the user that has email & password that match the ones in this scope
            const user = await database.getWaiterDetails(name.name, email);
            let daysOfTheWeek = await database.getWeekdays();
    
            if (user) {
                bcrypt.compare(password, user.password, (err, result) => {
                    if (result) {
                        console.log('Login successful');
                        messages.success = 'Login successful!';
                        messages.error = '';
                        res.render('select_days', {daysOfTheWeek, username: user.name, success: messages.success});
                    } else {
                        console.log('Invalid password');
                        messages.error = 'Invalid password';
                        messages.success = '';
                        res.render('register', {daysOfTheWeek, username: user.name, error: messages.error, success: messages.success});
                    }
                });
    
            } 

        } else {
            messages.error = 'User not found';
                messages.success = '';
                res.render('register', {error: messages.error, success: messages.success})
        }
    }
    
    return {
        renderIndex,
        addWaiterFromRoute,
        postWaiterDays,
        handleAdmin,
        changeWaiterSchedule,
        handleReset,
        handleRegister,
        handleLogin
    }
}
