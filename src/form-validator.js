class FormValidator {

	constructor(formSelector = "form", form = undefined) {
		if (form === undefined) {
			this.form = document.querySelector(formSelector);
		} else {
			this.form = form;
		}

		this.attribs = FormValidator.attribs !== undefined ? FormValidator.attribs : {
			required: "required",
			range: "range",
			min: "min",
			max: "max",
			length: "length",
			minlength: "minlength",
			maxlength: "maxlength",
			pattern: "pattern",
			type: "type",
		};

		this.types = FormValidator.types !== undefined ? FormValidator.types : {
			email: "email",
			url: "url",
			float: "float",
			integer: "integer",
			digits: "digits",
			alphanum: "alphanum",
		};

		this.typesRegex = FormValidator.typesRegex !== undefined ? FormValidator.typesRegex : {
			email: new RegExp("^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$","i"),
			url: new RegExp(`^(?!mailto:)(?:(?:http|https|ftp)://)(?:\\S+(?::\\S*)?@)?(?:(?:(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[0-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))|localhost)(?::\\d{2,5})?(?:(/|\\?|#)[^\\s]*)?$`, "i"),
			float: new RegExp("^(\\+|\\-)?\\d+(\\.\\d+)?$"),
			integer: new RegExp("^(\\+|\\-)?\\d+$"),
			digits: new RegExp("^\\d$"),
			alphanum: new RegExp("^[a-z]+$", "i"),
		};

		this.messages = FormValidator.messages !== undefined ? FormValidator.messages : {
			type: {
				email: "این مقدار باید یک ایمیل معتبر باشد",
				url: "این مقدار باید یک آدرس معتبر باشد",
				float: "این مقدار باید یک عدد معتبر باشد",
				integer: "این مقدار باید یک عدد صحیح معتبر باشد",
				digits: "این مقدار باید یک رقم باشد",
				alphanum: "این مقدار باید حروف الفبا باشد",
			},
			required: "این مقدار باید وارد شود",
			pattern: "این مقدار به نظر می رسد نامعتبر است",
			min: "این مقدار باید بزرگتر یا مساوی %s باشد",
			max: "این مقدار باید کوچکتر و یا مساوی %s باشد",
			range: "این مقدار باید بین %s و %s باشد",
			length: "این مقدار نامعتبر است و باید بین %s و %s باشد",
			minlength: "این مقدار بیش از حد کوتاه است. باید %s کاراکتر یا بیشتر باشد.",
			maxlength: "این مقدار بیش از حد طولانی است. باید %s کاراکتر یا کمتر باشد.",
		};

		this.errorStyles = FormValidator.errorStyles !== undefined ? FormValidator.errorStyles : {
			input: {
				className: "validator-input-error",
				style: "background: #faedec;border: 1px solid #e85445;",
			},
			errorDiv: {
				className: "validator-error-div",
				style: "color: #e74c3c;padding-right: 0;",
			},
		}

		this.inputs = {};

		this.currentElementValue = null;

		this.init();
	}

	init() {
		this.form.validator = this;
		this.createErrorClasses();
		this.form.querySelectorAll("textarea,input,select").forEach((element, index) => {
			const errorDiv = document.createElement('div');
			errorDiv.id = `validator-error-${index.toString()}`;
			errorDiv.className = this.errorStyles.errorDiv.className;
			errorDiv.style.display = "none";
			element.insertAdjacentElement('afterend', errorDiv);
			this.inputs[index] = {
				attributes: this.getElementCheckInputAttrs(element),
				element: element,
				errorDiv: errorDiv,
			};
			element.oninput = (event) => {
				this.inputValidateEvent(event.target, index);
			}
		});
	}

	createErrorClasses() {
		if (document.getElementById("validator-error-style") !== null) {
			return;
		}
		const style = document.createElement("STYLE");
		style.id = "validator-error-style";
		style.innerHTML = `.${this.errorStyles.input.className} {
				${this.errorStyles.input.style}
			}\n
			.${this.errorStyles.errorDiv.className} {
				${this.errorStyles.errorDiv.style}
			}\n`;
		const head = document.getElementsByTagName("head")[0];
		head.appendChild(style);
	}

	isValid() {
		let flag = true;
		for (const inputIndex of Object.keys(this.inputs)) {
			const element = this.inputs[inputIndex].element;
			this.currentElementValue = element.value;
			const elementErrorDiv = this.inputs[inputIndex].errorDiv;
			let result = this.inputValidate(inputIndex);
			if (result.flag === false) {
				elementErrorDiv.style.display = "block";
				elementErrorDiv.innerText = result.error;
				if (element.className.search(this.errorStyles.input.className) === -1) {
					element.className += ` ${this.errorStyles.input.className}`;
				}
				flag = false;
				continue;
			}
			elementErrorDiv.style.display = "none";
			element.className = element.className.replace(this.errorStyles.input.className, "");
		}
		return flag;
	}

	inputValidateEvent(element, inputIndex) {
		const elementErrorDiv = this.inputs[inputIndex].errorDiv;
		this.currentElementValue = element.value;
		let result = this.inputValidate(inputIndex);
		if (result.flag === false) {
			elementErrorDiv.style.display = "block";
			elementErrorDiv.innerText = result.error;
			return;
		}
		elementErrorDiv.style.display = "none";
		element.className = element.className.replace(this.errorStyles.input.className, "");
	}

	inputValidate(inputIndex) {
		let result = { flag: true, };
		for (const attribute of this.inputs[inputIndex].attributes) {
			result = this.attributeValidate(attribute);
			if (result.flag === false) {
				return result;
			}
		}
		return result;
	}

	attributeValidate(attribute) {
		let result = {};
		result.flag = true;
		switch (attribute.name) {
			case 'required':
				result = this.validateRequired(attribute);
				break;
			case 'range':
				result = this.validateRange(attribute);
				break;
			case 'min':
				result = this.validateMin(attribute);
				break;
			case 'max':
				result = this.validateMax(attribute);
				break;
			case 'length':
				result = this.validateLength(attribute);
				break;
			case 'minlength':
				result = this.validateMinLength(attribute);
				break;
			case 'maxlength':
				result = this.validateMaxLength(attribute);
				break;
			case 'pattern':
				result = this.validatePattern(attribute);
				break;
			case 'type':
				result = this.validateType(attribute);
				break;
		}
		return result;
	}

	validateRequired(attribute) {
		let result = {};
		if (this.currentElementValue === "") {
			result = {
				flag: false,
				error: this.messages[attribute.name]
			}
			return result;
		}
		result.flag = true;
		return result;
	}

	validateRange(attribute) {
		let result = {};
		if (/^((\+|\-)?\d+(\.\d+)?)?$/.test(this.currentElementValue) === false) {
			result = {
				flag: false,
				error: this.messages.type.float,
			}
			return result;
		}
		const range = attribute.value.match(/\d+(\.\d+)?/g);
		const min = Number(range[0]);
		const max = Number(range[1]);
		const inputValue = Number(this.currentElementValue === "" ? max : this.currentElementValue);
		if (min <= inputValue && max >= inputValue) {
			result.flag = true;
			return result;
		}
		const minMax = [min, max];
		const error = this.messages[attribute.name].replace(/%s/g, () => {
			return minMax.shift();
		});
		result = {
			flag: false,
			error: error,
		}
		return result;
	}

	validateMin(attribute) {
		let result = {};
		if (/^((\+|\-)?\d+(\.\d+)?)?$/.test(this.currentElementValue) === false) {
			result = {
				flag: false,
				error: this.messages.type.float,
			}
			return result;
		}
		const min = Number(attribute.value);
		const inputValue = Number(this.currentElementValue === "" ? min : this.currentElementValue);
		if (min <= inputValue) {
			result.flag = true;
			return result;
		}
		result = {
			flag: false,
			error: this.messages[attribute.name].replace("%s", [min]),
		}
		return result;
	}

	validateMax(attribute) {
		let result = {};
		if (/^((\+|\-)?\d+(\.\d+)?)?$/g.test(this.currentElementValue) === false) {
			result = {
				flag: false,
				error: this.messages.type.float,
			}
			return result;
		}
		const max = Number(attribute.value);
		const inputValue = Number(this.currentElementValue === "" ? max : this.currentElementValue);
		if (max >= inputValue) {
			result.flag = true;
			return result;
		}
		result = {
			flag: false,
			error: this.messages[attribute.name].replace("%s", [max]),
		}
		return result;
	}

	validateLength(attribute) {
		let result = {};
		const range = attribute.value.match(/\d+/g);
		const inputValue = this.currentElementValue;
		const min = Number(range[0]);
		const max = Number(range[1]);
		if (min <= inputValue.length && max >= inputValue.length || inputValue.length === 0) {
			result.flag = true;
			return result;
		}
		const minMax = [min, max];
		const error = this.messages[attribute.name].replace(/%s/g, () => {
			return minMax.shift();
		});
		result = {
			flag: false,
			error: error,
		}
		return result;
	}

	validateMinLength(attribute) {
		let result = {};
		const inputValue = this.currentElementValue;
		const min = Number(attribute.value);
		if (min <= inputValue.length || inputValue.length === 0) {
			result.flag = true;
			return result;
		}
		result = {
			flag: false,
			error: this.messages[attribute.name].replace("%s", [min]),
		}
		return result;
	}

	validateMaxLength(attribute) {
		let result = {};
		const max = Number(attribute.value);
		const inputValue = this.currentElementValue;
		if (max >= inputValue.length || inputValue.length === 0) {
			result.flag = true;
			return result;
		}
		result = {
			flag: false,
			error: this.messages[attribute.name].replace("%s", [max]),
		}
		return result;
	}

	validatePattern(attribute) {
		let result = {};
		const regexString = attribute.value;
		const flags = regexString.replace(/.*\/([gimy]*)$/, '$1');
		const pattern = regexString.replace(new RegExp('^/(.*?)/' + flags + '$'), '$1');
		const regex = new RegExp(pattern, flags);
		if (regex.test(this.currentElementValue) === false) {
			result = {
				flag: false,
				error: this.messages[attribute.name],
			}
			return result;
		}
		result.flag = true;
		return result;
	}

	validateType(attribute) {
		let result = {};
		const type = this.getElementType(attribute.value);
		result.flag = true;
		if (Object.keys(this.types).includes(type) === false) {
			return result;
		}
		if (this.typesRegex[type].test(this.currentElementValue) === false &&
			this.currentElementValue !== "") {
			result = {
				flag: false,
				error: this.messages.type[type],
			}
			return result;
		}
		return result;
	}

	getElementCheckInputAttrs(element) {
		let attrsAndValue = [];
		Object.keys(this.attribs).forEach((attribute) => {
			if (element.hasAttribute(this.attribs[attribute])) {
				attrsAndValue.push({
					name: attribute,
					value: element.getAttribute(attribute),
				});
			}
		});
		return attrsAndValue;
	}

	getElementType(elementType) {
		if (elementType === null) {
			return "not supported";
		}
		const typeNames = Object.keys(this.types);
		for (const name of typeNames) {
			if (this.types[name] === elementType) {
				return name;
			}
		}
		return "not supported";
	}

	static customise(variableName, newValue) {
		if(!(["attribs", "types", "typesRegex", "messages", "errorStyles"].includes(variableName))){
			return false;
		}
		FormValidator[variableName] = newValue;
		return true;
	}
}