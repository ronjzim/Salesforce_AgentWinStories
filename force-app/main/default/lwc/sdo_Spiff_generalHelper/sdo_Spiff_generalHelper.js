/****************************UTILITY METHODS*************************************/

//This method capatilizes first letter of every word in the sentence
const capatilizeFirstOfEachWord = (sentence)=>{

    const arr = sentence.split(" "); 
    
    //loop through each element of the array and capitalize the first letter. 
    for (var i = 0; i < arr.length; i++) { 
        arr[i] = arr[i].charAt(0).toUpperCase() + arr[i].slice(1); 
    } 

    //Join all the elements of the array back into a string //using a blankspace as a separator 
    return arr.join(" ");

}

//export capatilizeFirstOfEachWord method in this general helper javascript
export {capatilizeFirstOfEachWord};