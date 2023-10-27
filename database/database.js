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

    async function addWaiter(waiterName){
        await db.none(`INSERT INTO waiters (name) VALUES($1)`, [waiterName]);
    }

    async function getWaiterId(waiterName){
        return await db.one('SELECT id FROM waiters WHERE name=$1', [waiterName]);
    }

    async function addShift(waiter_id, daysArray){
        //loop over the days array 
        for(let i = 0; i < daysArray.length; i++){
            //Get the ID of that particular day
            let dayID =  await getDayId(daysArray[i]);
            // Populate the shifts table
            await db.none(`INSERT INTO shifts (waiter_id, day_id) VALUES($1, $2)`, [waiter_id, dayID.id]);
        }
    }

    async function getTableContents(tableName){
       return await db.manyOrNone('SELECT * FROM $1;', [tableName]);
    }

    async function getWaiterDays(waiterName){

        let sample = await db.manyOrNone(`SELECT waiters.name,
                                            shifts.waiter_id, shifts.day_id,
                                            days.day
                                            FROM waiters
                                            JOIN shifts
                                            ON waiters.id=shifts.waiter_id
                                            JOIN days
                                            ON days.id=shifts.day_id
                                            WHERE name=$1;`, [waiterName]);
        
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

    async function updateShift(waiterID, newDays){
        //make sure the days length is within limits
        if(newDays.length < 3){
            return 'Not enough days were selected';
        } else if(newDays.length > 5){
            return 'You have selected more days than allowed';
        } else {

            //delete the previoud shift of the specific user
            await db.none('delete from shifts where waiter_id=$1', waiterID);
            
            //call addShift and pass in the newly selected days
            await addShift(waiterID, newDays);
            
            return 'Waiter days successfully updated';
        }
        
    }
    
    async function getAvailableWaiters(){
        return await db.manyOrNone('select * from waiters')
    }

    async function waitersAvailableToday(day){
        let waitersAvailable = await db.manyOrNone(`SELECT waiters.name
                FROM days
                JOIN shifts
                ON days.id=shifts.day_id
                JOIN waiters
                ON waiters.id=shifts.waiter_id
                WHERE day=$1;`, [day]);
 
        // console.log(day+'list :', waitersAvailable);

        return waitersAvailable;
    }

    async function moveWaiterToNewDay(waiterId, oldDayId, newDayId){
        await db.none(`UPDATE shifts
                        SET day_id=$1
                        WHERE waiter_id=$2 AND day_id=$3`, [newDayId, waiterId, oldDayId]);
    }

    async function resetApp(){
        await db.none('DELETE FROM shifts;');
        await db.none('DELETE FROM waiters;');
    }

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
        updateShift,
        getAvailableWaiters,
        waitersAvailableToday,
        moveWaiterToNewDay,
        resetApp
    }
}