export default function Waiters(){
    function checkWaiterDays(days, daysOfTheWeek){         
        for(let i = 0; i < daysOfTheWeek.length; i++){
            for(let j = 0; j < days.length; j++){
                if(days[j] == daysOfTheWeek[i].day){
                    //true
                    // checkedDays[workdays[i]] = true;
                    daysOfTheWeek[i].checked = true;
                }
            }
        }
    }

    function getColor(waiterDays){
        if(waiterDays.length == 1){
            return 'crimson';
        } else if(waiterDays.length < 3 && waiterDays.length > 1){
            return 'orange';
        } else if(waiterDays.length == 3){
            return 'green';
        } else if(waiterDays.length > 3){
            return 'purple';
        }
    }

    function getAdminDay(today, dayWaiters){
        //create a data entity for each day of the week
        let data = {};
        
        //Add the properties to the DATA object
        data.day = today;
        data.waiters = dayWaiters;
        data.bgColor = getColor(dayWaiters);
        // dataStructure.push(data);
        return data;
    }

    function validName(username){
        //regex
        const pattern = /^[A-Za-z\s]+$/;
        //test the username parameter against the regex
        return pattern.test(username);     
    }

    function capitalizeName(waiterName){
        return waiterName[0].toUpperCase() + waiterName.slice(1);
    }

    return {
        checkWaiterDays,
        getColor,
        validName,
        getAdminDay,
        capitalizeName
    }
}