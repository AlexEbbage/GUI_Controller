class GuiController {
    constructor(config) {
        console.log(`Gui created`);
        this._this = this;
        this.config = config;
        this.tabs = {};
        this.inputs = {};
        this.closed = false;

        this.htmlMain = document.createElement("div");
        GuiHelper.addClass(this.htmlMain, "ae-gui");

        this.htmlTabList = document.createElement("ul");
        this.htmlMain.appendChild(this.htmlTabList);

        this.htmlClose = document.createElement("div");
        this.htmlClose.innerHTML = "Close";
        GuiHelper.addClass(this.htmlClose, "close");
        GuiHelper.bind(this.htmlClose, "click", this.toggleClosed.bind(this));
        this.htmlMain.appendChild(this.htmlClose);

        document.body.appendChild(this.htmlMain);
    }

    addTab(tabName) {
        if (this.tabs[tabName] !== undefined) {
            throw new Error(`A tab with the name '${tabName}' already exists in the GUI.`);
        }
        let tab = new GuiTab(this, tabName);
        this.tabs[tabName] = tab;

        this.htmlTabList.appendChild(tab.htmlTab);

        this.htmlTabList.style.maxHeight = `${this.htmlTabList.scrollHeight}px`;

        return tab;
    }

    toggleClosed() {
        console.log(`${this.closed ? "Opening" : "Closing"} settings.`);
        this.closed = !this.closed;
        if (this.closed) {
            GuiHelper.addClass(this.htmlMain, "closed");
            this.htmlClose.innerHTML = "Open";
            this.htmlTabList.style.maxHeight = null;
        } else {
            GuiHelper.removeClass(this.htmlMain, "closed");
            this.htmlClose.innerHTML = "Close";
            this.htmlTabList.style.maxHeight = `${this.htmlTabList.scrollHeight}px`;
        }

        return this;
    }
}

class GuiTab {
    constructor(guiController, tabName) {
        console.log(`Tab added: '${tabName}'`);
        this.guiController = guiController;
        this.tabName = tabName;
        this.closed = true;

        this.htmlTab = document.createElement("li");
        GuiHelper.addClass(this.htmlTab, "tab");
        GuiHelper.addClass(this.htmlTab, "closed");

        this.htmlHeader = document.createElement("div");
        this.htmlHeader.innerHTML = tabName;
        GuiHelper.addClass(this.htmlHeader, "tab-header");
        this.htmlTab.appendChild(this.htmlHeader);

        this.htmlInputList = document.createElement("ul");
        this.htmlTab.appendChild(this.htmlInputList);

        GuiHelper.bind(this.htmlHeader, "click", this.toggleClosed.bind(this));
    }

    toggleClosed() {
        console.log(`${this.closed ? "Opening" : "Closing"} tab '${this.tabName}'.`);
        this.closed = !this.closed;
        if (this.closed) {
            GuiHelper.addClass(this.htmlTab, "closed");
        } else {
            GuiHelper.removeClass(this.htmlTab, "closed");
        }
        this.updateHeight();

        return this;
    }

    addInput(propertyName) {
        if (this.guiController.inputs[propertyName] !== undefined) {
            throw new Error(`The GUI already contains a controller for the property by the name of '${propertyName}'.`);
        } else if (this.guiController.config[propertyName] === undefined) {
            throw new Error(`The config doesn't contain a property by the name of '${propertyName}'.`);
        }

        if (Array.isArray(arguments[1]) || typeof arguments[1] === "object") {
            return new GuiSelectController(this, propertyName);
        }

        switch (typeof this.guiController.config[propertyName]) {
            case "string":
                return new GuiStringInput(this, propertyName);
            case "boolean":
                return new GuiBooleanInput(this, propertyName);
            case "function":
                return new GuiFunctionInput(this, propertyName);
            case "number":
                if (typeof arguments[1] === "number" && typeof arguments[2] === "number") {
                    if (typeof arguments[3] === "number") {
                        return new GuiRangeInput(this, propertyName, { min: arguments[1], max: arguments[2], step: arguments[3] });
                    }
                    else {
                        return new GuiRangeInput(this, propertyName, { min: arguments[1], max: arguments[2] });
                    }
                }
                else {
                    if (typeof arguments[1] === "number") {
                         return new GuiNumberInput(this, propertyName, {step: arguments[1]}); }
                    else {
                        return new GuiNumberInput(this, propertyName);
                    }
                }
            default:
                return null;
        }
    }

    open() {
        this.closed = false;
        GuiHelper.removeClass(this.htmlTab, "closed");
        this.updateHeight();

        return this;
    }

    updateHeight() {
        if (this.closed) {
            this.htmlInputList.style.maxHeight = null;
            let alteredHeight = this.guiController.htmlTabList.scrollHeight - this.htmlInputList.scrollHeight;
            this.guiController.htmlTabList.style.maxHeight = `${alteredHeight}px`;
        }
        else {
            this.htmlInputList.style.maxHeight = `${this.htmlInputList.scrollHeight}px`;
            let alteredHeight = this.guiController.htmlTabList.scrollHeight + this.htmlInputList.scrollHeight;
            this.guiController.htmlTabList.style.maxHeight = `${alteredHeight}px`;
        }

        return this;
    }
}

class GuiInput {
    static inputCounter = 0;

    constructor(tab, propertyName) {
        this.id = `ae_input_${GuiInput.inputCounter++}`;

        this.config = tab.guiController.config;
        this.propertyName = propertyName;
        this.defaultValue = this.config[propertyName];

        this.htmlInputController = document.createElement("div");
        GuiHelper.addClass(this.htmlInputController, "input-controller");

        this.htmlName = document.createElement("div");
        this.htmlName.innerHTML = propertyName;
        GuiHelper.addClass(this.htmlName, "name");
        this.htmlInputController.appendChild(this.htmlName);

        this.htmlInputContainer = document.createElement("div");
        GuiHelper.addClass(this.htmlInputContainer, "input");
        this.htmlInputController.appendChild(this.htmlInputContainer);

        tab.guiController.inputs[propertyName] = this;
        tab.htmlInputList.appendChild(this.htmlInputController);
        tab.updateHeight();
    }
}

class GuiStringInput extends GuiInput {
    constructor(tab, propertyName) {
        console.log(`Text controller added for '${propertyName}'`);

        super(tab, propertyName);

        GuiHelper.addClass(this.htmlInputController, "type-text");

        this.htmlInput = document.createElement("input");
        this.htmlInput.setAttribute("type", "text");
        this.htmlInput.value = this.defaultValue;
        this.htmlInputContainer.appendChild(this.htmlInput);

        return this;
    }
}

class GuiNumberInput extends GuiInput {
    constructor(tab, propertyName, properties) {
        console.log(`Number controller added for '${propertyName}'`);

        super(tab, propertyName);

        const _properties = properties || {};

        this.step = _properties.step;

        if (typeof this.step === "undefined") {
            this.step = 1;
        }

        GuiHelper.addClass(this.htmlInputController, "type-number");

        this.htmlInput = document.createElement("input");
        this.htmlInput.setAttribute("type", "number");
        this.htmlInput.setAttribute("step", this.step);
        this.htmlInput.value = this.defaultValue;
        this.htmlInputContainer.appendChild(this.htmlInput);

        return this;
    }
}

class GuiBooleanInput extends GuiInput {
    constructor(tab, propertyName) {
        console.log(`Boolean controller added for '${propertyName}'`);

        super(tab, propertyName);

        GuiHelper.addClass(this.htmlInputController, "type-boolean");

        this.htmlInput = document.createElement("input");
        this.htmlInput.setAttribute("type", "checkbox");
        this.htmlInput.id = this.id;
        this.htmlInputContainer.appendChild(this.htmlInput);

        this.htmlCheckboxLabel = document.createElement("label");
        this.htmlCheckboxLabel.setAttribute("for", this.id);
        this.htmlInputContainer.appendChild(this.htmlCheckboxLabel);
        this.htmlInput.checked = this.defaultValue;

        return this;
    }
}

class GuiRangeInput extends GuiInput {
    constructor(tab, propertyName, properties) {
        console.log(`Range controller added for '${propertyName}'`);

        super(tab, propertyName);

        const _properties = properties || {};
        this.min = _properties.min;
        this.max = _properties.max;
        this.step = _properties.step;

        if (typeof this.min === "undefined") {
            this.min = null;
        }
        if (typeof this.max === "undefined") {
            this.max = null;
        }
        if (typeof this.step === "undefined") {
            this.step = 1;
        }

        GuiHelper.addClass(this.htmlInputController, "type-range");

        this.htmlInput = document.createElement("input");
        this.htmlInput.setAttribute("type", "range");
        this.htmlInput.setAttribute("step", this.step);
        if (this.min !== null) this.htmlInput.setAttribute("min", this.min);
        if (this.max !== null) this.htmlInput.setAttribute("max", this.max);
        this.htmlInput.setAttribute("value", this.defaultValue);
        this.htmlInputContainer.appendChild(this.htmlInput);

        this.htmlRangeSelector = document.createElement("input");
        this.htmlRangeSelector.setAttribute("type", "text");
        this.htmlRangeSelector.setAttribute("value", this.defaultValue);
        this.htmlInputContainer.appendChild(this.htmlRangeSelector);


        GuiHelper.bind(this.htmlRangeSelector, "change", this.updateRangeBar.bind(this));
        GuiHelper.bind(this.htmlInput, "input", this.updateRangeSelector.bind(this));

        return this;
    }

    step(increment) {
        this.stepSize = increment;
        this.htmlInput.setAttribute("step", this.step);

        return this;
    }

    updateRangeSelector() {
        this.htmlRangeSelector.value = this.htmlInput.value;

        return this;
    }

    updateRangeBar() {
        let newValue = Number(this.htmlRangeSelector.value);
        if (!isNaN(newValue)) {
            if (this.min !== null && newValue < this.min) {
                newValue = this.min;
            }
            else if (this.max !== null && newValue > this.max) {
                newValue = this.max;
            }
        }
        else {
            newValue = this.htmlInput.value;
        }
        this.htmlInput.value = newValue;
        this.htmlRangeSelector.value = newValue;

        return this;
    }
}

class GuiHelper {
    constructor() { }

    static addClass(element, className) {
        if (element.className === undefined) {
            element.className = className;
        }
        else if (element.className !== className) {
            const classes = element.className.split(/ +/);
            if (classes.indexOf(className) === -1) {
                classes.push(className);
                element.className = classes.join(' ').replace(/^\s+/, '').replace(/\s+$/, '');
            }
        }
    }

    static removeClass(element, className) {
        if (className) {
            if (element.className === className) {
                element.removeAttribute('class');
            } else {
                const classes = element.className.split(/ +/);
                const index = classes.indexOf(className);
                if (index !== -1) {
                    classes.splice(index, 1);
                    element.className = classes.join(' ').replace(/^\s+/, '').replace(/\s+$/, '');
                }
            }
        }
    }

    static bind(element, eventName, func, active) {
        const isActive = active || false;
        if (element.addEventListener) {
            element.addEventListener(eventName, func, isActive);
        }
        else if (element.attachEvent) {
            element.attachEvent(`on${eventName}`, func);
        }
    }

    static unbind(element, event, func, active) {
        const isActive = active || false;
        if (element.removeEventListener) {
            element.removeEventListener(eventName, func, isActive);
        }
        else if (element.detachEvent) {
            element.detachEvent(`on${eventName}`, func);
        }
    }

    static isUndefined(value) {
        return typeof value === "undefined";
    }
}