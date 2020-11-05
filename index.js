const EventEmitter = require('events');
const lodash = require('lodash');

class Trend {

    constructor() {
        this._rand = lodash.random(1, 98);
        this._powder = Math.min(99 - this._rand, 99 - (99 - this._rand))
    }

    hasPowder() {
        return this._powder > 0;
    }

    checkRand(rand) {
        this._powder--;
        return rand > this._rand
    }
}

class Market extends EventEmitter {

    _interval = 100;
    _price = 0;
    _ticks = [];

    start() {
        this._interval = setInterval(this._tick.bind(this), this._interval)
    }

    stop() {
        clearInterval(this._interval)
    }

    _tick() {
        const trend = this._getTrend();
        const up = trend.checkRand(lodash.random(0,99));
        if (up) {
            this._price+=1;
        } else {
            this._price-=1;
        }
        this._ticks.push(this._price);
        this.emit('tick');
    }

    _getTrend() {
        if (this._curTrend && this._curTrend.hasPowder()) {
            return this._curTrend;
        } else {
            this._curTrend = new Trend();
        }
        return this._curTrend;
    }

    get bid() {
        return this._price;
    }

    get ask() {
        return this._price + 1;
    }

    get trend() {
        return this._curTrend;
    }
}

const market = new Market();
market.start();

market.on('tick', function()  {
    console.log(market.trend, market.bid, market.ask)
});

setTimeout(()=>{
    market.stop();
    console.log(market._ticks)
}, 5000);
