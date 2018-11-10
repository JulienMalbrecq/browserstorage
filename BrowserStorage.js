const emptyValue = '{"value":null, "_lastUpdate": -1}';
const defaultConfig = {
    driver: 'local',
    prefix: '',
    ttl: 60 * 60 * 24 * 1000 // 24h
};

class BrowserStorage {
    constructor(config = {}) {
        config = Object.assign({}, defaultConfig, config);
        this.prefix = config.prefix + '_';
        this.storage = window[config.driver + 'Storage'];
        this.ttl = config.ttl;

        // clear obsolete data
        Object.keys(this.storage)
            .filter(name => name.startsWith(this.prefix))
            .forEach(name => this.get(name));
    }

    set (name, value) {
        this.storage.setItem(this.prefix +  name, JSON.stringify({ value, _lastUpdate: new Date().getTime() }));
    }

    get (name, defaultValue = null) {
        let prop = JSON.parse(this.storage.getItem(this.prefix + name) || emptyValue);

        if (prop._lastUpdate === undefined || prop._lastUpdate + this.ttl <= new Date().getTime()) {
            this.clear(name);
            prop = { value: null };
        }

        return prop.value !== null ? prop.value : defaultValue;
    }

    getAll () {
        let values = {};

        Object.keys(this.storage)
            .filter(storedName => storedName.startsWith(this.prefix))
            .forEach(storedName => {
                let name = storedName.substr(this.prefix.length);
                values[name] = this.get(name);
            });

        return values;
    }

    clear (name) {
        this.storage.removeItem(this.prefix + name);
    }

    clearAll () {
        Object.keys(this.storage)
            .filter(name => name.startsWith(this.prefix))
            .forEach(name => this.storage.removeItem(name));
    }

}

export default BrowserStorage;

// vue helper
const defaultComputedDefs = { setter: true };
export function computedHelper (storage, computedProps = []) {
    let computed = {};

    computedProps.forEach(variable => {
        if (typeof variable === 'string') {
            variable = { name: variable, alias: variable};
        }

        let defs = Object.assign({}, defaultComputedDefs, variable);
        computed[defs.alias] = { get : ()  => storage.get(defs.name) };

        if (defs.setter) {
            computed[defs.alias].set = (value)  => storage.set(defs.name, value);
        }
    });

    return computed;
}