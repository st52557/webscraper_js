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

const favicon = require('serve-favicon');
const path = require('path');

app.use("/public", express.static('public'));
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(express.static(__dirname+'/public'));

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


app.use(bodyParser.urlencoded({ extended: true }));
var jsonParser = bodyParser.json()

app.post('/auth', jsonParser, function (req, res) {
    if(req.body.password){
        console.log(req.body);
    }
    res.setHeader('Content-type', 'text/html');
    res.render("response-index.html", );
})



app.get('/', function (req, res) {

    console.log(__dirname+'/public');

    if(req.body){
        console.log(req.body.pass);
    }
    res.setHeader('Content-type', 'text/html');
    res.render("response-timer.html", );

})

app.get('/index', function (req, res) {

    if(req.body){
        console.log(req.body.pass);
    }
    res.setHeader('Content-type', 'text/html');
    res.render("response-index.html", );

})


app.get('/dira', async function (req, res) {

    let urlDira = 'https://dodiri.cz/';

    var mapDira = new Map();
    let urlDiraNumberOfPages = 3;
    let minRating = 30;
    let loadImages = 1;
    if (req.query.load) {
        if (parseInt(req.query.load) >= 1 && parseInt(req.query.load) < 21)
            urlDiraNumberOfPages = parseInt(req.query.load);
    }

    if (req.query.img) {
        if (parseInt(req.query.img) === 0 || parseInt(req.query.img) === 1)
            loadImages = parseInt(req.query.img);
    }

    if (req.query.rating) {
        if (parseInt(req.query.rating) >= 1 && parseInt(req.query.rating) <= 100)
            minRating = parseInt(req.query.rating);
    }


    let responseCount = 0;
    for (let i = 1; i < urlDiraNumberOfPages + 1; i++) {
        const articles = [];
        urlDira = 'https://dodiri.cz/page/' + i + '/';
        articles.push({
            title: "Page: " + i + "    ",
            url: ""
        })
        console.log(urlDira);
        axios(urlDira)
            .then(async response => {
                let html = response.data
                const $ = cheerio.load(html)

                $('#primary .g1-collection-items .g1-collection-item', html).each(function () { //<-- cannot be a function expression
                    const title = $(this).find('h3').text()
                    const url = $(this).find('h3 a').attr('href')
                    let img = "images off ";
                    if (loadImages) {
                        img = $(this).find('img').attr('src')
                    }
                    let rating = $(this).find('.snax-voting-score').text().trim()
                    const date = $(this).find('.entry-date').text()
                    const info = $(this).find('.entry-summary').text()
                    rating = rating.replace("Hodnocení", "");
                    rating = rating.trim();
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

                mapDira.set(i, articles);

            }).catch(err => console.log(err))
    }

    while (responseCount < urlDiraNumberOfPages) {
        console.log("waiting");
        await new Promise(r => setTimeout(r, 3000));
    }
    const mapAsc = new Map([...mapDira.entries()].sort((a, b) => parseInt(a) - parseInt(b)));

    let items = Array.from(mapAsc.values());
    items = items.flat(2);

    console.log("send response");

    res.setHeader('Content-type', 'text/html');
    res.render("response-dira.html", {items: items, minRating: minRating});


})


app.get('/navrat', async (req, res) => {
    let urlNavrat = 'https://www.navratdoreality.cz/'
    let urlNavratNumberOfPages = 3;
    let minRating = 7;
    let loadImages = 1;

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
                console.log(i, articles);
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
