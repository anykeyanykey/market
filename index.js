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

	_interval = 10;
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
		const up = trend.checkRand(lodash.random(0, 99));
		if (up) {
			this._price += 1;
		} else {
			this._price -= 1;
		}
		this._ticks.push(this._price);
		this.emit('tick', up);
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

	get minLots() {
		return 1
	}
}

class Order {

	_closed = false

	constructor(market, type, lots) {
		this.market = market
		const {bid, ask, minLots} = this.market
		this.type = type
		this.lots = lots || minLots
		switch (this.type) {
			case 'buy':
				this.oop = ask
				break
			case 'sell':
				this.oop = bid
				break
		}
	}

	get oppositeType() {
		return this.type === 'buy' ? 'sell' : 'buy'
	}

	get profit() {
		if (this.closed) {
			switch (this.type) {
				case 'buy':
					return (this.ocp - this.oop) * this.lots
				case 'sell':
					return (this.oop - this.ocp) * this.lots
			}
		} else {
			const {bid, ask} = this.market
			switch (this.type) {
				case 'buy':
					return (bid - this.oop) * this.lots
				case 'sell':
					return (this.oop - ask) * this.lots
			}
		}
	}

	close() {

		if (this.closed) {
			return;
		}

		const {bid, ask} = this.market

		switch (this.type) {
			case 'buy':
				this.ocp = bid
				break
			case 'sell':
				this.ocp = ask
				break
		}

		this._closed = true
	}

	get closed() {
		return this._closed
	}
}

class History {
	orders = []

	constructor(market) {
		this.market = market;
	}

	get lastOrder() {
		return this.orders[this.orders.length - 1]
	}

	get historyOrders() {
		return this.orders.filter(({closed}) => closed)
	}

	get historyLoss() {
		let result = 0;
		const orders = this.historyOrders
		for (let i = orders.length - 1; i >= 0; i--) {
			const {profit} = orders[i];
			if (profit < 0) {
				result += profit
			} else {
				break
			}
		}
		return Math.abs(result);
	}

	get profit() {
		let result = 0;
		const orders = this.orders
		for (let i = orders.length - 1; i >= 0; i--) {
			const {profit} = orders[i];
			result += profit
		}
		return result;
	}
}

const market = new Market();
const history = new History(market);
market.start();

market.on('tick', function (up) {
	console.log(market.trend, market.bid, market.ask)
	const {lastOrder: last, historyLoss} = history
	if (last) {
		const {profit, lots, oppositeType, type} = last
		if (profit <= -5 * lots) {
			last.close()
			history.orders.push(new Order(market, oppositeType, lots * 2))
		} else if (profit >= historyLoss + 1) {
			last.close()
			history.orders.push(new Order(market, type))
		}
	} else {
		history.orders.push(new Order(market, up ? 'buy' : 'sell'))
	}
});

setTimeout(() => {
	market.stop();
	console.log(market._ticks)
	console.log(history.orders.map(({type, profit}) => `${type} ${profit}`))
	console.log(history.profit)
}, 5000);
