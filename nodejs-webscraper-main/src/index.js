const axios = require('axios')
const cheerio = require('cheerio')
const Browser = require('zombie');
const express = require('express')
const app = express()
const cors = require('cors')
app.use(cors())
const rateLimit = require('express-rate-limit')

var fs = require('fs');
var bodyParser = require('body-parser');
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.set('views', "./nodejs-webscraper-main" + '/views');
app.use("/public", express.static('public'));

const apiRequestLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 10, // limit each IP to 10 requests per windowMs
    handler: function (req, res, /*next*/) {
        return res.status(429).json({
            error: 'You sent too many requests. Please wait a while then try again'
        })
    }
})

// Use the limit rule as an application middleware
app.use(apiRequestLimiter)

let urlNavrat = 'https://www.navratdoreality.cz/'
let urlNavratNumberOfPages = 3;
let minRating = 7;
let loadImages = 1;

app.use(bodyParser.urlencoded({ extended: true }));
var jsonParser = bodyParser.json()

app.post('/auth', jsonParser, function (req, res) {
    console.log(req.body);
    if(req.body){
        console.log(req.body.pass);
    }
    res.setHeader('Content-type', 'text/html');
    res.render("response-index.html", );
})



app.get('/', function (req, res) {
    console.log("get / : "+req.body);
    if(req.body){
        console.log(req.body.pass);
    }
    res.setHeader('Content-type', 'text/html');
    res.render("response-index.html", );

})


app.get('/dira', function (req, res) {

    res.setHeader('Content-type', 'text/html');
    res.render("response-dira.html", );

})


app.get('/navrat', async (req, res) => {
    var mapNavrat = new Map();
    urlNavratNumberOfPages = 3;
    minRating = 7;
    loadImages = 1;
    if(req.query.load){
        if(parseInt(req.query.load) >= 1 && parseInt(req.query.load) < 21)
        urlNavratNumberOfPages = parseInt(req.query.load);
    }

    if(req.query.img){
        if(parseInt(req.query.img) === 0 || parseInt(req.query.img) === 1)
            loadImages = parseInt(req.query.img);
    }

    if(req.query.rating){
        if(parseInt(req.query.rating) >= 1 && parseInt(req.query.rating) <= 10)
            minRating = parseInt(req.query.rating);
    }

    console.log("/navrat");
    let responseCount = 0;
    for (let i = 0; i < urlNavratNumberOfPages + 1; i++) {
        const articles = [];
        if (i === 0) {
            urlNavrat = 'https://www.navratdoreality.cz/';
        } else {
            urlNavrat = 'https://navratdoreality.cz/?list-page=' + i + '&do=list-changePage';
        }
        articles.push({
            title: "Page: " + i + "    ",
            url: ""
        })
        axios(urlNavrat)
            .then(async response => {
                let html = response.data
                const $ = cheerio.load(html)

                $('.mainbar .item', html).each(function () { //<-- cannot be a function expression
                    const title = $(this).find('a strong').text()
                    const url = $(this).find('a').attr('href')
                    let img = "images off ";
                    if(loadImages){
                        img = $(this).find('img').attr('src')
                    }
                    const rating = $(this).find('.item-info-rank-val').text()
                    const date = $(this).find('.item-meta').text()
                    const info = $(this).find('.p-like').text()
                    if (title || url) {
                        articles.push({
                            title,
                            url,
                            img,
                            rating,
                            date,
                            info
                        })
                    }

                })
                console.log(i);
                responseCount += 1;

                mapNavrat.set(i, articles);

            }).catch(err => console.log(err))
    }

    while (responseCount < urlNavratNumberOfPages) {
        console.log("waiting");
        await new Promise(r => setTimeout(r, 3000));
    }
    const mapAsc = new Map([...mapNavrat.entries()].sort((a, b) => parseInt(a) - parseInt(b)));

    let items = Array.from( mapAsc.values() );
    items= items.flat(2);

    console.log("send response");

    res.setHeader('Content-type', 'text/html');
    res.render("response-navrat.html", {items: items, minRating: minRating});

})

app.listen(process.env.PORT || 8000, function(){
    console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});
