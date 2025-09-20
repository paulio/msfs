class HelloWorldDisplay extends BaseInstrument {
    constructor() {
        super();
    }

    get templateID() {
        return "HelloWorldDisplayID";
    }

    Init() {
        super.Init();
    }

    connectedCallback() {
        super.connectedCallback();
        const electricityElement = document.getElementById("Electricity");
                const divElement = document.createElement("div");
                divElement.setAttribute("id", "HelloWorld");
                divElement.innerHTML = "A change - Guage";
                electricityElement.appendChild(divElement);
    }
}
registerInstrument("simple-glass-cockpit-sample", HelloWorldDisplay);