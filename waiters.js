export default function Waiters(){
    async function checkWaiterDays(days, daysOfTheWeek){         
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

    return {
        checkWaiterDays
    }
}