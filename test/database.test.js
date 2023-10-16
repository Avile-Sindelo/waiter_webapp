import Database from "../database/database.js";
import assert from "assert";
import pgp from "pg-promise";

const connectionString = process.env.DATABASE_URL || 'postgres://kxtscboh:BuTUiYZKVdaTcmuaEy6zPR_oUwHiXgh1@silly.db.elephantsql.com/kxtscboh?ssl=true';
const postgresP = pgp();
const db = postgresP(connectionString);

describe('Waiter webapp tests', function(){
    this.timeout(10000);
    this.beforeEach(async function(){
        await db.none("DELETE FROM shifts;");
        await db.none("DELETE FROM waiters;");
    })

    it("should test if you able to add a waiter into the waiters table", async function(){
        //Create the database instance
        let database = Database(db);
        //Add a waiter named Sxolile
        await database.addWaiter('Sxolile');
        //Grab the assigned ID for waiter Sxolile
        let userID = await database.getWaiterId('Sxolile');

        //Expected result
        let result = [{id: userID.id, name: 'Sxolile'}];
        //Test the result against the available waiters
        assert.deepEqual(result, await database.getAvailableWaiters());
    });

    it("should test if you are able to add a waiter's shift in the SHIFTS table", async function(){
        //Database instance creation
        let database = Database(db);
        //Get the available waiters
        let waiters = await database.getAvailableWaiters();
        //Make sure that to start with, there is NO available waiters
        assert.deepEqual([], waiters);         
       
        //Add a waiter named Zuko in the database
        await database.addWaiter('Zuko');
        //Choose days for waiter Zuko
        let days = ['Tuesday', 'Friday', 'Sunday'];
        //Get the ID of the waiter Zuko from the waiters table
        let waiter = await database.getWaiterId('Zuko');
        //Add the shift using the waiter ID and the list of days selected by the waiter
        await database.addShift(waiter.id, days);
       
        //Get the days, from the SHIFTS table, associated with waiter Zuko
        let waiterDays = await database.getWaiterDays('Zuko');
        //Test if the returned days are identical to the ones that were picked by the waiter earlier
        assert.deepEqual(days, waiterDays);
     
    });

    it('should test if you are able to update a waiter shift', async function(){
        //Instatiate an instance of the database
        let database = Database(db);
        //Add a waiter
        await database.addWaiter('Steve');
        //Select days
        let initialShift = ['Tuesday', 'Friday', 'Sunday'];
        //get the id of the waiter from the Waiters table
        let steveID = await database.getWaiterId('Steve');
        //Add a shift for the waiter 
        await database.addShift(steveID.id, initialShift);
            //Test the initial shift
            let result1 = await database.getWaiterDays('Steve');
            assert.deepEqual(result1, initialShift);
       
        //Update the shift
        let updatedShift = ['Monday', 'Wednesday', 'Saturday']
        await database.updateShift(steveID.id, updatedShift);
        //Test the newly updated shift
        let result2 = await database.getWaiterDays('Steve');
        assert.deepEqual(result2, updatedShift);
    });
})