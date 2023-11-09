const Events = require('events');

class Mutex extends Events {
    constructor() {
        super();
        this.locked = false;
    }

    async wait() {
        if (this.locked) await new Promise(resolve => this.once('unlocked', resolve));
    }

    async lock() {
        while (this.locked) await this.wait();
        this.locked = true;
    }

    async unlock() {
        if (this.locked) this.locked = false;
    }

    async do(action) {
        try {
            await this.lock();
            return await action();
        } finally {
            await this.unlock();
        }
    }
}

module.exports = Mutex;
