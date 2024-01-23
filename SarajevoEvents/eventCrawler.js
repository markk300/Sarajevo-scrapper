const { Builder, By, until } = require('selenium-webdriver');
require('chromedriver');


//Function for pressing day on the calendar
const clickDayButton = async (driver,dayOfMonth) =>{
  const xpath = `//*[@id="__next"]/div/div[3]/div[1]/div/div[2]/div/div/div/div[2]/button[${dayOfMonth}]`;
  await driver.findElement(By.xpath(xpath)).click();
}


// Main function for web scraping
(async function Crawler() {
    const fetch = await import('node-fetch');
    let driver = await new Builder().forBrowser('chrome').build();
    const EVENT_URL = 'https://www.sarajevoin.ba/event';
    const EVENT_CLASS_NAME = 'Event_singleEvent__KOwmb';
    // Initialize an empty array to store scraped data
    let list = [];
    // Get the current date
    const currentDate = new Date();
    let dayOfMonth = currentDate.getDate();

    try {
        await driver.get(EVENT_URL);
        let elements = await driver.findElements(By.className(EVENT_CLASS_NAME));
        
      console.log("elements:",elements.length)
        // Loop through the found elements
        for (let i = 0; i < elements.length; i++) {
            
                let events = {};
                
                await clickDayButton(driver, dayOfMonth);
                console.log(dayOfMonth)
                console.log('outside if',i)
                // Get the date element and extract text
                const dateElement = await driver.findElement(By.xpath('//*[@id="__next"]/div/div[3]/div[2]/div/div[1]/h2'))
                const startDate = await dateElement.getText();
                events = {...events, startDate}

                elements = await driver.findElements(By.className(EVENT_CLASS_NAME));
                
                const titleElement = await elements[i].findElement(By.className('Event_selectedEventText__tLPSX'));
                const title = await titleElement.getText();
                events = { ...events, title };
                driver.executeScript("arguments[0].scrollIntoView(true);", titleElement)

                

                const locationElement = await elements[i].findElement(By.className('Event_single-event-location-name___E_K8'))
                const location = await locationElement.getText();
                events = {...events, location}
                
                const timeElement = await elements[i].findElement(By.className('Event_single-event-time__NrhNZ'))
                const startTime = await timeElement.getText();
                events = {...events,startTime}
                
                const existTemp = await fetch.default(
                    'https://app-4romxvc23a-uc.a.run.app/v1/events/checksSarajevoEvents',{
                        method:'POST',
                        body: JSON.stringify({
                        title:title,
                        startTime:startTime

                    }),headers:{
                        'Content-Type': 'application/json'
                    },
                    redirect: 'follow'
                }
                )
                console.log(existTemp);
                const exist = await existTemp.json()
                // If the event already exists, skip to the next iteration
                if(exist){
                    console.log('Skipping event as it already exists:', title, startTime);
                    // If it's the last element, skip to the next day
                    if(i === elements.length - 1){
                      dayOfMonth++;
                      i= -1;
                    }
                    continue;
                }
                
                elements[i].click()
                await driver.wait(until.elementLocated(By.className('Event_modal-information-price__qzKsX css-1ngehnn')), 5000);
                
                try {
                  const findSrcElement = await driver.findElement(By.className('Event_modal-image-container__O_Qfi'))
                  const imageElement = await findSrcElement.findElement(By.css('img'));
                  const images = await imageElement.getAttribute('src');
                  events = { ...events, image: [images] };
                  
  
                  const priceElement = await driver.findElement(By.className('Event_modal-information-price__qzKsX css-1ngehnn'))
                  const priceValue = await priceElement.getText();
                  events = {...events,priceValue}

                  const descriptionElement = await driver.findElement(By.className('chakra-text Event_modal-body-text__jHthh css-0'))
                  const description = await descriptionElement.getText();
                  events = {...events,description}

                  console.log(events)
                } catch (error) {
                   console.log(error)
                }
                
                const back = await driver.findElement(By.className('Event_modal-close-button__uDSCF css-1a8mfs8')).click()
                list.push(events);
                
                // If it's the last element, skip to the next day
                if(i === elements.length - 1 && dayOfMonth <= 31){
                  console.log('Skipping Day',dayOfMonth)
                  dayOfMonth++;
                  i= -1;
                  
                }
                
                await driver.sleep(1500)
            
                fetch.default(
                    
                    "https://app-4romxvc23a-uc.a.run.app/v1/events/addSarajevoEvents",
                    {
                      method: 'POST',
                      body: JSON.stringify(events),
                      headers: {
                        'Content-Type': 'application/json'
                      },
                      redirect: 'follow'
                    })
                    .then(response => response.text())
                    .then(result =>
                    {
                      console.log('Recorded data: ', result)
                    })
                    .catch(error =>
                    {
                      console.log('Error recording data', error, JSON.stringify(error))
                      setSending(false)
                    });
                    list.push(events)
            
        }
        

    } finally {
        await driver.quit();
    }
})();
