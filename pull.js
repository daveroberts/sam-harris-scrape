const FEED_XML_FILE = 'feed.xml'
const MP3_DIR = "Z:\\Podcasts\\Sam Harris\\"
const fs = require('fs')
const https = require('https')
async function download_file(url, filename){
  return new Promise((resolve, reject)=>{
    let file = fs.createWriteStream(filename)
    https.get(url, response=>{
      response.pipe(file)
      // after download completed close filestream
      file.on("finish", ()=>{
        file.close()
        resolve()
      })
    })
  })
  
}
const parse_xml = require('xml2js').parseStringPromise;

async function main(){
  let xml = fs.readFileSync(FEED_XML_FILE)
  let parsed_xml = await parse_xml(xml)
  let xml_items = parsed_xml.rss.channel[0].item
  let items = xml_items.map(xml_item => {
    let title = xml_item.title[0]
    let subtitle = xml_item["itunes:subtitle"][0]
    let pubDate = xml_item.pubDate[0]
    let guid = xml_item.guid[0]["_"]
    let web_link = xml_item.link[0]
    let mp3_link = xml_item.enclosure[0]["$"]["url"]
    let duration_seconds = xml_item["itunes:duration"][0]
    let item = {title, subtitle, pubDate, guid, web_link, mp3_link, duration_seconds}
    return item
  })
  console.log(`${items.length} items in list`)
  fs.writeFileSync(MP3_DIR + `podcast_list.json`, JSON.stringify(items,null,2))
  for(let item of items){
    let filename = `${item.title}.mp3`
    filename = filename.replace(/[\?:]/gi, '').trim()
    let filepath = MP3_DIR + filename
    if (fs.existsSync(filepath)){ continue }
    console.log(`Downloading ${filepath}`)
    await download_file(item.mp3_link, filepath)
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  console.log(`Done`)
}

main()