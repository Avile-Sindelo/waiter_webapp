export default function Database(db){
    async function waiterAlreadyExists(waiter){
        let waiterList  = await db.oneOrNone('SELECT * FROM waiters WHERE name=$1; ', [waiter]);
        if(waiterList == null){
            return false;
        } else {
            return true;
        }
    }

    async function getDayId(day){
        return await db.one('SELECT id FROM days WHERE day=$1; ', [day]);
    }

    async function addWaiter(waiter){
        await db.none(`INSERT INTO waiters (name) VALUES($1)`, [waiter]);
    }

    async function getWaiterId(waiter){
        return await db.one('SELECT id FROM waiters WHERE name=$1', [waiter]);
    }

    async function addShift(waiter_id, day_id){
        await db.none(`INSERT INTO shifts (waiter_id, day_id) VALUES($1, $2)`, [waiter_id, day_id]);
    }

    async function getTableContents(tableName){
       return await db.manyOrNone('SELECT * FROM $1;', [tableName]);
    }

    async function getWaiterDays(waiter){

        let sample = await db.manyOrNone(`SELECT waiters.name,
                                            shifts.waiter_id, shifts.day_id,
                                            days.day
                                            FROM waiters
                                            JOIN shifts
                                            ON waiters.id=shifts.waiter_id
                                            JOIN days
                                            ON days.id=shifts.day_id
                                            WHERE name=$1;`, [waiter]);
        
        let days = [];
        for(let i = 0; i < sample.length; i++){
            days.push(sample[i].day);
        }

        return days;        
    }

    async function viewAllShifts(){
        return await db.manyOrNone('SELECT * FROM shifts;');
    }

    async function getWeekdays(){
        return await db.many('SELECT day FROM days');
    }

    async function updateDays(waiterID, newDays){
        //update the days 
        await db.none(`UPDATE shifts
        SET column1 = value1, column2 = value2, ...
        WHERE condition;`)
    }
    
    //update function

    return {
        waiterAlreadyExists,
        getDayId,
        addWaiter,
        getWaiterId,
        addShift,
        getWaiterDays,
        getTableContents,
        viewAllShifts,
        getWeekdays,
        updateDays
    }
}