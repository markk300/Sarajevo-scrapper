const { Builder, By, until } = require('selenium-webdriver');
require('chromedriver');
const FileSystem = require('fs');


(async function Crawler() {
    const fetch = await import('node-fetch');
    let driver = await new Builder().forBrowser('chrome').build();
    let list = [];

    try {
        await driver.get('https://www.sarajevoin.ba/event');
        let elements = await driver.findElements(By.className('Event_singleEvent__KOwmb'));
        
      console.log("elements:",elements.length)
        for (let i = 0; i < elements.length; i++) {
            
                let events = {};
                const currentDate = new Date();
                let dayOfMonth = currentDate.getDate();
               
                await driver.findElement(By.xpath(`//*[@id="__next"]/div/div[3]/div[1]/div/div[2]/div/div/div/div[2]/button[${dayOfMonth}]`)).click()
                if(i == elements.length - 1){
                  console.log('Skipping Day',dayOfMonth)
                  dayOfMonth++;
                  await driver.findElement(By.xpath(`//*[@id="__next"]/div/div[3]/div[1]/div/div[2]/div/div/div/div[2]/button[${dayOfMonth}]`)).click()
                  console.log(dayOfMonth)
                  i=0
                }
                const dateElement = await driver.findElement(By.xpath('//*[@id="__next"]/div/div[3]/div[2]/div/div[1]/h2'))
                const date = await dateElement.getText();
                events = {...events, date}

                elements = await driver.findElements(By.className('Event_singleEvent__KOwmb'));
                
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
                    'http://127.0.0.1:5001/maptobe-dev/us-central1/app/v1/events/checksSarajevoEvents',{
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
                const exist = await existTemp.json()
                
                if(exist){
                    console.log('Skipping event as it already exists:', title, startTime);
                    continue;
                }
                
                elements[i].click()
                await driver.sleep(2000)
                
                await driver.wait(until.elementLocated(By.className('Event_modal-information-price__qzKsX css-1ngehnn')), 5000);
                
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
                
                
                
                const back = await driver.findElement(By.className('Event_modal-close-button__uDSCF css-1a8mfs8')).click()
                list.push(events);
                await driver.sleep(1500)
            
                

                fetch.default(
                    
                    "http://127.0.0.1:5001/maptobe-dev/us-central1/app/v1/events/addSarajevoEvents",
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
