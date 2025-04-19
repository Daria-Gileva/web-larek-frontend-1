// Типов данных с которыми будете работать в приложении.
// Как минимум у вас должны быть описаны объекты приходящие к вам через API
// и объекты выводимые на экране. Ваши модели в итоге должны будут
// трансформировать один тип в другой.

import { EventEmitter } from '../components/base/events';
import { Api } from '../components/base/api';
import * as utils from '../utils/utils';

// Presenter

interface IEventEmitter {
	emit: (event: string, data?: unknown) => void;
	on: (event: string, callback: (event: unknown) => void) => void;
}
// Интерфейс API-клиента
// Интерфейсы модели данных
// Интерфейсы отображений
// Интерфейсы базовых классов
// Перечисление событий и их интерфейсы (если используете брокер)
// Любые другие типы и интерфейсы если вы заложили их в архитектуру

export interface IProductModel {
	id: string;
	description: string;
	image: string;
	title: string;
	category: string;
	price: number | null;
}

export interface ICatalogModel {
	readonly addEvent: string; // 'Catalog:Change';
	items: Array<IProductModel>;
	// Заполнить элементы
	// Послать сигнал
	setItems(items: Array<IProductModel>): void;

	// Разименовать элемент
	getProduct(id: string): IProductModel;

	// Очистиь элементы
	// Послать сигнал
	removeAll(): void;
}

export class CatalogModel implements ICatalogModel {
	items: IProductModel[];
	addEvent: string = 'Catalog:Change';

	constructor(protected _event: IEventEmitter) {}

	getProduct(id: String): IProductModel {
		for (let counter = 0; counter < this.items.length; counter++) {
			if (this.items[counter].id == id) {
				return this.items[counter];
			}
		}
	}
	removeAll(): void {
		this.items.splice(0, this.items.length);
		this._event.emit(this.addEvent, this.items);
	}
	setItems(items: Array<IProductModel>): void {
		this.items = items;
		this._event.emit(this.addEvent, this.items);
	}
}

enum Payment {
	card = 'card',
	cash = 'cash',
}

export interface IDeliveryModel {
	payment: Payment;
	address: string;

	clear(): void;
}

// class DeliveryModel implements IDeliveryModel {
// 	protected _payment: Payment;
// 	protected _address: string;
// 	clear(): void {
// 		this._payment = Payment.card;
// 		this._address = null;
// 	}
// }

export interface IContactModel {
	phone: string;
	email: string;

	clear(): void;
}

// class ContactModel implements IContactModel {
// 	protected _phone: string;
// 	protected _email: string;
// 	clear(): void {
// 		this._phone = null;
// 		this._email = null;
// 	}
// }

export interface IOrderModel extends IDeliveryModel, IContactModel {
	total: number;
	items: string[];

	clear(): void;
}

class OrderModel implements IOrderModel {
	payment: Payment;
	address: string;
	phone: string;
	email: string;
	total: number;
	items: string[];
	clear(): void {
		this.payment = Payment.card;
		this.address = null;
		this.phone = null;
		this.email = null;
		this.total = null;
		this.items = null;
	}
}

export interface IBasketModel {
	readonly changeEvent: string; //'Backet:Change';

	items: Array<IProductModel>;

	add(item: IProductModel): void;

	// Добавить элемент
	// Отправить addressEvent

	remove(id: Number): void;
	// Удалить элемент
	// Отправить addressEvent

	removeAll(): void;
	// Удалить элементы
	// Отправить addressEvent

	getCounter(): Number;
	getAllSum(): Number;
	// Вернуть сумму элементов
}

export class BasketModel implements IBasketModel {
	changeEvent: string = 'Backet:Change';
	items: Array<IProductModel> = [];

	constructor(protected _event: IEventEmitter) {}

	add(item: IProductModel): void {
		this.items.push(item);
		this._event.emit(this.changeEvent, this.items);
	}
	remove(id: Number): void {
		this.items.splice(id.valueOf(), id.valueOf());
		this._event.emit(this.changeEvent, this.items);
	}
	removeAll(): void {
		this.items.splice(0, this.items.length);
		this._event.emit(this.changeEvent, this.items);
	}
	getCounter(): Number {
		return this.items.length;
	}
	getAllSum(): Number {
		let price = 0;
		this.items.forEach((element) => {
			price += element.price;
		});
		return price;
	}
}

export interface IOrderResponseModel {
	id: string;
	total: number;
}

class OrderResponseModel implements IOrderResponseModel {
	id: string;
	total: number;
}

// API
export interface IProductListResponceModel {
	total: number;
	items: IProductModel[];
}

export interface IAppAPI {
	getProductList: () => Promise<IProductModel[]>;
	order: (order: IOrderModel) => Promise<IOrderResponseModel>;
}

export class AppApi extends Api implements IAppAPI {
	readonly cdn: string;

	constructor(cdn: string, baseUrl: string, options?: RequestInit) {
		super(baseUrl, options);

		this.cdn = cdn;
	}

	getProductList(): Promise<IProductModel[]> {
		return this.get('/product').then((data: IProductListResponceModel) =>
			data.items.map((item) => ({
				...item,
				image: this.cdn + item.image,
			}))
		);
	}

	order(order: IOrderModel): Promise<IOrderResponseModel> {
		return this.post('/order', order).then((data: IOrderResponseModel) => data);
	}
}

// View

interface IView {
	render(data?: unknown): HTMLElement;
}

export class Modal implements IView {
	protected _closeButton: HTMLButtonElement;
	protected _content: HTMLElement;
	openEvent = 'Modal:Open';
	closeEvent = 'Modal:Close';

	constructor(
		protected _container: HTMLElement,
		protected _events: IEventEmitter
	) {
		this._closeButton = _container.querySelector('.modal__close');
		this._content = _container.querySelector('.modal__content');
		this._closeButton.addEventListener('click', this.close.bind(this));
		this._container.addEventListener('click', this.close.bind(this));
		// this._container.addEventListener('esc', this.close.bind(this));
		this._content.addEventListener('click', (event) => event.stopPropagation());
	}
	set content(value: HTMLElement) {
		this._content.replaceChildren(value);
	}
	open() {
		this._container.classList.add('modal_active');
		this._events.emit(this.openEvent);
	}

	close() {
		this._container.classList.remove('modal_active');
		this.content = null;
		this._events.emit(this.closeEvent);
	}
	render(data?: HTMLElement): HTMLElement {
		this._content.replaceChildren(data);
		return this._container;
	}
}

export class ProductView implements IView {
	protected _title: HTMLElement;
	protected _price: HTMLElement;
	protected _description?: HTMLElement;
	protected _image?: HTMLImageElement;
	protected _category?: HTMLElement;
	protected _button?: HTMLButtonElement;
	protected _container: HTMLElement;

	event: string;
	id: string;

	constructor(
		template: HTMLTemplateElement,
		protected _events: IEventEmitter,
		name: String
	) {
		this.event = name + ':Action';

		this._container = utils.cloneTemplate<HTMLElement>(template);

		this._title = this._container.querySelector('.card__title');
		this._price = this._container.querySelector('.card__price');
		this._description = this._container.querySelector('.card__text');
		this._image = this._container.querySelector('.card__image');
		this._category = this._container.querySelector('.card__category');
		this._button = this._container.querySelector('.card__button');

		if (this._button) {
			this._button.addEventListener('click', () => this.onAction());
		} else {
			this._container.addEventListener('click', () => this.onAction());
		}
	}

	onAction() {
		this._events.emit(this.event, this.id);
	}

	render(data?: IProductModel): HTMLElement {
		if (data) {
			this.id = data.id;
			this._title.innerText = data.title;
			this._price.innerText = `$${data.price}`;
			if (this._description) {
				this._description.innerText = data.description;
			}
			if (this._image) {
				this._image.src = data.image;
			}
			if (this._category) {
				this._category.innerText = data.category;
			}
		}
		return this._container;
	}
}

export class BasketView implements IView {
	protected _price: HTMLElement;
	protected _button: HTMLButtonElement;
	protected _container: HTMLElement;
	protected _list: HTMLUListElement;
	readonly submitEvent = 'Busket:submit';

	constructor(template: HTMLTemplateElement, protected _events: IEventEmitter) {
		this._container = utils.cloneTemplate<HTMLElement>(template);

		this._price = utils.ensureElement<HTMLElement>(
			'.basket__price',
			this._container
		);
		this._list = utils.ensureElement<HTMLUListElement>(
			'.basket__list',
			this._container
		);
		this._button = utils.ensureElement<HTMLButtonElement>(
			'.basket__button',
			this._container
		);
		this._button.addEventListener('click', () => this.onConfirm());
	}

	onConfirm() {
		// послать сигнал submitEvent, с _products
	}

	render(products: HTMLElement[]): HTMLElement {
		products.forEach((product) => {
			this._list.appendChild(product);
		});

		return this._container;
	}

	protected updateTotalPrice(total: Number): void {
		this._price.textContent = `Total Price: $${total}`;
		// выдать позиции для каждого дочернего элемента container
	}
}

export class Page implements IView {
	protected _basketButton: HTMLButtonElement;
	protected _basketCounter: HTMLElement;
	protected _catalog: HTMLElement;

	event: string = 'Basket:Open';

	constructor(
		protected _wrapper: HTMLElement,
		protected _events: IEventEmitter
	) {
		this._basketButton = utils.ensureElement<HTMLButtonElement>(
			'.header__basket',
			this._wrapper
		);
		this._basketCounter = utils.ensureElement<HTMLElement>(
			'.header__basket-counter',
			this._wrapper
		);
		this._catalog = utils.ensureElement<HTMLElement>('.gallery', this._wrapper);

		this._basketButton.addEventListener('click', () => {
			this.lock(true);
			this._events.emit(this.event);
		});
	}

	updateCounter(value: Number) {
		this._basketCounter.textContent = String(value);
	}

	lock(value: boolean) {
		if (value) this._wrapper.classList.add('page__wrapper_locked');
		else this._wrapper.classList.remove('page__wrapper_locked');
	}

	render(items: HTMLElement[]): HTMLElement {
		items.forEach((item) => {
			this._catalog.appendChild(item);
		});

		return this._wrapper;
	}
}

class Form {
	protected _submit: HTMLButtonElement;
	protected _container: HTMLFormElement;

	readonly submitEvent = 'Form:submit';

	constructor(template: HTMLTemplateElement, protected _events: IEventEmitter) {
		this._container = utils.cloneTemplate<HTMLFormElement>(template);

		this._submit = utils.ensureElement<HTMLButtonElement>(
			`.order__button`,
			this._container
		);

		// Установить обработчик события
	}
	isValid(value: boolean) {
		this._submit.disabled = !value;
	}
	clearFields() {
		// Очистить поля
	}
	onConfirm(data?: unknown) {
		this._events.emit(this.submitEvent, data);
		// Отправить событие submitEvent
	}
}

class DeliveryFormView extends Form implements IView {
	protected _payment: Array<HTMLButtonElement>;
	protected _address: HTMLInputElement;
	protected _container: HTMLFormElement;

	readonly paymentEvent = 'Form:PaymentChange';
	readonly addressEvent = 'Form:AddressChange';

	constructor(
		template: HTMLTemplateElement,
		protected _events: IEventEmitter,
		action: (data?: unknown) => void
	) {
		super(template, _events);

		this._payment = utils.ensureAllElements(`.button_alt`, this._container);
		this._address = utils.ensureElement<HTMLInputElement>(
			`.form__input`,
			this._container
		);

		this._payment.forEach((button) => {
			button.addEventListener('click', () => {
				this.setPayment(button.name);
			});
		});
	}

	setAddress(value: string) {
		this._address.value = value;
	}

	setPayment(name: string) {
		this._payment.forEach((button) => {
			button.classList.remove('button_alt-active');
		});

		const selectedButton = this._payment.find((button) => button.name === name);
		if (selectedButton) {
			selectedButton.classList.add('button_alt-active');
			// this._events.emit(this.paymentEvent, { paymentMethod: name });
		}
	}

	render(data: IDeliveryModel): HTMLElement {
		if (data) {
			this.setAddress(data.address);
			this.setPayment(data.payment);
		}
		return this._container;
	}
}

class ContactFormView extends Form implements IView {
	protected _phone: HTMLInputElement;
	protected _email: HTMLInputElement;

	readonly paymentEvent = 'Form:PhoneChange';
	readonly addressEvent = 'Form:EmailChange';

	constructor(
		template: HTMLTemplateElement,
		protected _events: IEventEmitter,
		action: (data?: unknown) => void
	) {
		super(template, _events);
		this._phone = utils.ensureElement<HTMLInputElement>(
			'#contacts input[name="phone"]',
			this._container
		);

		this._email = utils.ensureElement<HTMLInputElement>(
			'#contacts input[name="email"]',
			this._container
		);
	}

	setPhone(value: string) {
		this._phone.value = value;
	}
	setEmail(value: string) {
		this._email.value = value;
	}
	render(data: IContactModel): HTMLElement {
		if (data) {
			this.setPhone(data.phone);
			this.setEmail(data.email);
		}
		return this._container;
	}
}

class SuccessView implements IView {
	protected _title: HTMLElement;
	protected _description: HTMLElement;
	protected _button: HTMLButtonElement;

	constructor(
		template: HTMLTemplateElement,
		protected _container: HTMLElement,
		protected _events: IEventEmitter,
		onClick: () => void
	) {
		this._title = utils.ensureElement<HTMLElement>(
			'.order-success__title',
			this._container
		);
		this._description = utils.ensureElement<HTMLElement>(
			'.order-success__description',
			this._container
		);
		this._button = utils.ensureElement<HTMLButtonElement>(
			'.order-success__close',
			this._container
		);

		this._button.addEventListener('click', onClick);
	}

	setTotal(value: number) {
		this._description.textContent += ` Total: ${value}`;
	}

	render(data: IOrderResponseModel): HTMLElement {
		this.setTotal(data.total);

		return this._container;
	}
}
