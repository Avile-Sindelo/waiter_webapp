import Database from "../database/database.js";
import assert from "assert";
import pgp from "pg-promise";

const connectionString = process.env.DATABASE_URL || 'postgres://kxtscboh:BuTUiYZKVdaTcmuaEy6zPR_oUwHiXgh1@silly.db.elephantsql.com/kxtscboh?ssl=true';
const postgresP = pgp();
const db = postgresP(connectionString);

describe('Waiter webapp tests', function(){
    this.timeout(8000);
    this.beforeEach(async function(){
        await db.none("DELETE FROM shifts;");
        await db.none("DELETE FROM waiters;");
    })

    it("should test if you able to add a waiter into the waiters table", async function(){
        let database = Database(db);
        
        await database.addWaiter('Sxolile');
        console.log('Waiter ID :', await database.getWaiterId('Sxolile'));
        console.log('Day ID :', await database.getDayId('Monday'));
        // assert.deepEqual({id:1}, await database.getWaiterId('Sxolile'));
    });

    it("should test if you are able to add a waiter's shift in the SHIFTS table", async function(){
        let database = Database(db);

        await database.addWaiter('Zuko');
        let waiter = await database.getWaiterId('Zuko');
        let dayOne = await database.getDayId('Tuesday');
        let dayTwo = await database.getDayId('Friday');
        let dayThree = await database.getDayId('Sunday');
        await database.addShift(waiter.id, dayOne.id);
        await database.addShift(waiter.id, dayTwo.id);
        await database.addShift(waiter.id, dayThree.id);
        console.log(await database.viewAllShifts());
        let waiterDays = await database.getWaiterDays('Zuko')
        console.log('Waiters Days :', waiterDays);
    });
})