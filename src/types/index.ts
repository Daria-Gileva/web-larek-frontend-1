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

export enum Payment {
	card = 'card',
	cash = 'cash',
}

export interface IDeliveryModel {
	payment: Payment;
	address: string;

	clear(): void;
	set(payment: Payment, address: string):void;
	validate(payment: Payment, address: string):boolean;
}

export class DeliveryModel implements IDeliveryModel {

	payment: Payment = Payment.card;
	address: string = "";

	clear(): void {
		this.payment = Payment.card;
		this.address = "";
	}
	validate(payment: Payment, address: string): boolean {
		if(!payment || !address) return false;
		return true;
	}
	set(payment: Payment, address: string): void{
		if(this.validate(payment,address)){
			this.payment = payment;
			this.address = address;
		}
	}
}


export interface IContactModel {
	phone: string;
	email: string;

	clear(): void;
	set(phone: string, email: string):void;
	validate(phone: string, email: string):boolean;
}

export class ContactModel implements IContactModel {
	phone: string = "";
	email: string = "";

	clear(): void {
		this.phone  = "";
		this.email  = "";
	}
	validate(phone: string, email: string): boolean {
		if(!phone || !email) return false;
		return true;
	}
	set(phone: string, email: string): void{
		if(this.validate(phone,email)){
			this.phone = phone;
			this.email = email;
		}
	}
}

export interface IOrderModel {
	total: number;
	items: string[];

	clear(): void;
	set(basket: IBasketModel): void;
}

export interface IOrderRequestModel {
	payment: Payment;
	address: string;
	phone: string;
	email: string;
	total: number;
	items: string[];
}

export class OrderRequestModel implements IOrderRequestModel {
	payment: Payment;
	address: string;
	phone: string;
	email: string;
	total: number;
	items: string[] = [];

	constructor(deliveryModel: IDeliveryModel, contactModel: IContactModel, basketModel: IBasketModel){
		this.payment = deliveryModel.payment;
		this.address = deliveryModel.address;
		this.phone = contactModel.phone;
		this.email = contactModel.email;
		this.total = basketModel.getAllSum().valueOf();
		basketModel.items.forEach(element=>{
			this.items.push(element.id);
		})
	}
}

export interface IBasketModel {
	readonly changeEvent: string; //'Backet:Change';

	items: Array<IProductModel>;

	add(item: IProductModel): void;
	isExist(item: IProductModel): boolean;
	remove(id: Number): void;
	removeAll(): void;
	getCounter(): Number;
	getAllSum(): Number;
}

export class BasketModel implements IBasketModel {
	changeEvent: string = 'Backet:Change';
	items: Array<IProductModel> = [];

	constructor(protected _event: IEventEmitter) {}

	add(item: IProductModel): void {
		if(!this.isExist(item)){
			this.items.push(item);
			this._event.emit(this.changeEvent, this.items);
		}
	}

	isExist(item: IProductModel): boolean{
		let exist = false;
		this.items.forEach(element => {
			if(element.id == item.id)
				exist = true
		})
		return exist;
	}

	remove(id: Number): void {
		this.items.splice(id.valueOf(), 1);
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
	order: (order: IOrderRequestModel) => Promise<IOrderResponseModel>;
}

export class AppApi extends Api implements IAppAPI {
	readonly cdn: string;
	readonly imgExtens?: string;

	constructor(cdn: string, baseUrl: string, imgExtens?: string, options?: RequestInit ) {
		super(baseUrl, options);

		this.cdn = cdn;
		this.imgExtens = imgExtens;
	}

	getProductList(): Promise<IProductModel[]> {
		return this.get('/product').then((data: IProductListResponceModel) =>
			data.items.map((item) => ({
				...item,
				image: this.cdn + (this.imgExtens? item.image.replace(/\.svg$/, this.imgExtens) : item.image),
			}))
		);
	}

	order(order: IOrderRequestModel): Promise<IOrderResponseModel> {
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
		document.addEventListener('keydown', (event: KeyboardEvent)=>{
			if (event.key === 'Escape') this.close()
		});
		this._container.addEventListener('click', (event) => {
			if (event.currentTarget === event.target)this.close()
		});
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
	render(data?: HTMLElement, actualName?: String): HTMLElement {
		this.openEvent = actualName+":Open";
		this.closeEvent = actualName+":Close";
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
	protected _index?: HTMLElement;
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
		this._index = this._container.querySelector('.basket__item-index');

		if (this._button) {
			this._button.addEventListener('click', () => this.onAction());
		} else {
			this._container.addEventListener('click', () => this.onAction());
		}
	}

	onAction() {
		this._events.emit(this.event, this._index? this._index.textContent :this.id);
	}

	setActiveSubmit(cond: boolean): void {
		if(cond){
			this._button.removeAttribute("disabled")
		}else {
			this._button.setAttribute("disabled", String(cond));
		}
	}

	render(data?: IProductModel, index?: Number): HTMLElement {
		if (data) {
			this.id = data.id;
			this._title.innerText = data.title;
			this._price.innerText = data.price?`${data.price} синапсов`:'Бесценно';
			if (this._description && data.description) {
				this._description.innerText = data.description;
			}
			if (this._image && data.image) {
				this._image.src = data.image;
			}
			if (this._category && data.category) {
				this._category.classList.remove('card__category_other');
				switch(data.category){
					case 'софт-скил':
						this._category.classList.add('card__category_soft');
						break;
					case 'дополнительное':
						this._category.classList.add('card__category_additional');
						break;
					case 'кнопка':
						this._category.classList.add('card__category_button');
						break;
					case 'хард-скил':
						this._category.classList.add('card__category_hard');
						break;
					default:
						this._category.classList.add('card__category_other');
				}
				this._category.innerText = data.category;
			}
			if (this._index && index) {
				this._index.innerText = String(index);
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
	readonly submit = 'Busket:Submit';

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
		this.setActiveSubmit(false)
		this._button.addEventListener('click', () => this.onConfirm());
	}

	onConfirm() {
		this._events.emit(this.submit)
	}

	render(products: HTMLElement[]): HTMLElement {
		this._list.replaceChildren();

		products.forEach((product) => {
			this._list.appendChild(product);
		});

		return this._container;
	}

	setActiveSubmit(cond: boolean) {
		if(cond){
			this._button.removeAttribute("disabled")
		}else {
			this._button.setAttribute("disabled", String(cond));
		}
	};

	updateTotalPrice(total: Number): void {
		this._price.textContent = `${total} синапсов`;
		// выдать позиции для каждого дочернего элемента container
	}
}

export class Page implements IView {
	protected _basketButton: HTMLButtonElement;
	protected _basketCounter: HTMLElement;
	protected _catalog: HTMLElement;

	event: string = 'Page:Action';

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
	protected _inputs?: HTMLInputElement[];
	protected _buttonsInput?: HTMLButtonElement[];

	submitEvent = 'Form:Submit';
	changeEvent = 'Form:Change';

	constructor(template: HTMLTemplateElement, protected _events: IEventEmitter, name?: string) {
		this._container = utils.cloneTemplate<HTMLFormElement>(template);

		let tmpContextActions = utils.ensureElement<HTMLElement>(`.modal__actions`, this._container);
		this._submit = utils.ensureElement<HTMLButtonElement>(
			`.button`,
			tmpContextActions
		);

		this._inputs = utils.ensureAllElements<HTMLInputElement>(".form__input", this._container)

		let tmpContextButtons = utils.ensureElement<HTMLElement>(`.order`, this._container);
		this._buttonsInput = utils.ensureAllElements<HTMLButtonElement>(".button", tmpContextButtons)

		if(name){
			this.submitEvent = name + ':Submit';
			this.changeEvent = name + ':Change';
		}
		this._inputs.forEach(element=>{
			element.addEventListener("input", (event:Event)=>{
				const target = event.target as HTMLInputElement;
				this._events.emit(this.changeEvent, target.value)
			})
		})
		this._buttonsInput.forEach(element=>{
			element.addEventListener("click", (event:Event)=>{
				const target = event.target as HTMLButtonElement;

				this._buttonsInput.forEach((button) => {
					button.classList.remove('button_alt-active');
				});
				target.classList.add('button_alt-active');
				this._events.emit(this.changeEvent, target.name)
			})
		})

		this._submit.addEventListener("click",  (e)=>{
			e.preventDefault();
			this.onConfirm();
		}
		)

	}

	setActiveSubmit(cond: boolean) {
		if(cond){
			this._submit.removeAttribute("disabled")
		}else {
			this._submit.setAttribute("disabled", String(cond));
		}
	};

	onConfirm() {
		this._events.emit(this.submitEvent);
	}
}

export class DeliveryFormView extends Form implements IView {
	protected _payment: Array<HTMLButtonElement>;
	protected _address: HTMLInputElement;

	constructor(
		template: HTMLTemplateElement,
		protected _events: IEventEmitter,
	) {
		super(template, _events, 'Delivery');

		let tmpContextActions = utils.ensureElement<HTMLElement>(`.order`, this._container);
		this._payment = utils.ensureAllElements(`.button`, tmpContextActions);
		this._address = utils.ensureElement<HTMLInputElement>(
			`.form__input`,
			this._container
		);

		this._payment.forEach((button) => {
			button.addEventListener('click', (event) => {
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
			}
	}

	getPayment() : Payment.card {
		let ret;
		this._payment.forEach((button) => {
			if(button.classList.contains('button_alt-active'))
				ret = button.name
		});
		return ret
	}

	getValues(){
		return{
			address: this._address.value,
			payment: this.getPayment()
		}
	}

	render(data: IDeliveryModel): HTMLElement {
			this.setAddress(data.address);
			this.setPayment(data.payment);
		return this._container;
	}
}

export class ContactFormView extends Form implements IView {
	protected _phone: HTMLInputElement;
	protected _email: HTMLInputElement;
	
	constructor(
		template: HTMLTemplateElement,
		protected _events: IEventEmitter
	) {
		super(template, _events, 'Contacts');
		
		console.log(this._container)
		this._phone = utils.ensureElement<HTMLInputElement>(
			'input[name="phone"]',
			this._container
		);

		this._email = utils.ensureElement<HTMLInputElement>(
			'input[name="email"]',
			this._container
		);
	}

	setPhone(value: string) {
		this._phone.value = value;
	}
	setEmail(value: string) {
		this._email.value = value;
	}

	getValues(){
		return{
			phone: this._phone.value,
			email: this._email.value,
		}
	}

	render(data: IContactModel): HTMLElement {
		if (data) {
			this.setPhone(data.phone);
			this.setEmail(data.email);
		}
		return this._container;
	}
}

export class SuccessView implements IView {
	protected _title: HTMLElement;
	protected _description: HTMLElement;
	protected _button: HTMLButtonElement;
	protected _container: HTMLElement;

	readonly event = "Success:Action"

	constructor(
		template: HTMLTemplateElement,
		protected _events: IEventEmitter
	) {
		this._container = utils.cloneTemplate<HTMLFormElement>(template);

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

		this._button.addEventListener('click', ()=>{
			this._events.emit(this.event);
		});
	}

	setTotal(value: number) {
		this._description.textContent = `Списано ${value} синапсов`;
	}

	render(data: IOrderResponseModel): HTMLElement {
		this.setTotal(data.total);

		return this._container;
	}
}
