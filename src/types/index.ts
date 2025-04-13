// Типов данных с которыми будете работать в приложении.
// Как минимум у вас должны быть описаны объекты приходящие к вам через API
// и объекты выводимые на экране. Ваши модели в итоге должны будут
// трансформировать один тип в другой.

import { EventEmitter } from '../components/base/events';
import { ensureElement } from '../utils/utils';
import { ensureAllElements } from '../utils/utils';
import { Api } from '../components/base/api';

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
	readonly addressEvent: string; // 'Catalog:Change';

	_items: Array<IProductModel>;

	// Заполнить элементы
	// Послать сигнал
	setItems(items: Array<IProductModel>): void;

	// Разименовать элемент
	getProduct(id: string): IProductModel;

	// Очистиь элементы
	// Послать сигнал
	removeAll(): void;
}

enum Payment {
	card = 'card',
	cash = 'cash',
}

export interface IDeliveryModel {
	_payment: Payment;
	_address: string;

	clear(): void;
}

export interface IContactModel {
	_phone: string;
	_email: string;

	clear(): void;
}

export interface IOrderModel extends IDeliveryModel, IContactModel {
	total: number;
	items: string[];

	clear(): void;
}

export class BasketModel {
	readonly addressEvent = 'Backet:Change';

	protected _items: Array<IProductModel>;

	add(item: IProductModel): void {
		// Добавить элемент
		// Отправить addressEvent
	}
	remove(item: IProductModel): void {
		// Удалить элемент
		// Отправить addressEvent
	}
	removeAll(): void {
		// Удалить элементы
		// Отправить addressEvent
	}

	getCounter(): Number {
		return this._items.length;
	}
	getAllSum(): Number {
		// Вернуть сумму элементов
		return 0;
	}
}

export interface IOrderResponseModel {
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

// Presenter

interface IEventEmitter {
	emit: (event: string, data?: unknown) => void;
	on: (event: string, callback: (event: unknown) => void) => void;
}

// View

interface IView {
	render(data?: unknown): HTMLElement;
}

class Modal implements IView {
	protected _closeButton: HTMLButtonElement;
	protected _content: HTMLElement;
	readonly openEvent = 'Modal:Open';
	readonly closeEvent = 'Modal:Close';

	constructor(
		protected _container: HTMLElement,
		protected _events: IEventEmitter
	) {
		this._closeButton = _container.querySelector('.modal__close');
		this._content = _container.querySelector('.modal__content');
		this._closeButton.addEventListener('click', this.close.bind(this));
		this._container.addEventListener('click', this.close.bind(this));
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

class ProductView implements IView {
	protected _title: HTMLElement;
	protected _price: HTMLElement;
	protected _identifierCard?: HTMLElement;
	protected _description?: HTMLElement;
	protected _image?: HTMLImageElement;
	protected _category?: HTMLElement;
	protected _button?: HTMLButtonElement;
	protected _buttonTitle: string;
	protected _container: HTMLElement;

	constructor(
		template: HTMLTemplateElement,
		protected events: IEventEmitter,
		protected actions?: () => {}
	) {
		// Создать контейнер по шаблону
		// найти _title _price _container
	}

	onAction() {
		this.actions();
	}

	render(data?: IProductModel): HTMLElement {
		return this._container;
	}
}

class BasketView implements IView {
	protected _products: Array<ProductView>;
	protected _price: HTMLElement;
	protected _button: HTMLButtonElement;
	readonly submitEvent = 'Busket:submit';

	constructor(
		protected _container: HTMLElement,
		protected _events: IEventEmitter
	) {
		// Заполнить поля
		// Добавить обработчики событий
	}

	onConfirm() {
		// послать сигнал submitEvent, с _products
	}

	render(data: IProductModel[]): HTMLElement {
		// выдать позиции для каждого дочернего элемента container
		return this._container;
	}
}

export class Page implements IView {
	protected _counter: HTMLElement;
	protected _catalog: HTMLElement;
	protected _wrapper: HTMLElement;
	protected _basket: HTMLElement;

	constructor(
		protected _container: HTMLElement,
		protected _events: IEventEmitter
	) {
		this._counter = ensureElement<HTMLElement>(
			'.header__basket-counter',
			_container
		);
		this._catalog = ensureElement<HTMLElement>('.gallery', _container);
		this._wrapper = ensureElement<HTMLElement>('.page__wrapper', _container);
		this._basket = ensureElement<HTMLElement>('.header__basket', _container);

		this._basket.addEventListener('click', () => {
			this._events.emit('basket:open');
		});
	}

	setCounter(value: number) {
		this._counter.textContent = String(value);
	}

	lock(value: boolean) {
		this._wrapper.classList.add('page__wrapper_locked');
	}

	unlock(value: boolean) {
		this._wrapper.classList.remove('page__wrapper_locked');
	}

	setCatalog(items: ICatalogModel[]) {
		// Очистить дочерние элементы и заполнить новыми
	}

	render(items: ICatalogModel[]): HTMLElement {
		// внедрить все элменты
		return this._container;
	}
}

class Form {
	protected _submit: HTMLButtonElement;

	readonly submitEvent = 'Form:submit';

	constructor(
		protected _container: HTMLFormElement,
		protected _events: IEventEmitter,
		protected _action: (data?: unknown) => void
	) {
		this._submit = ensureElement<HTMLButtonElement>(
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
		this._action(data);
		// Отправить событие submitEvent
	}
}

class DeliveryFormView extends Form implements IView {
	protected _payment: Array<HTMLButtonElement>;
	protected _address: HTMLInputElement;

	readonly paymentEvent = 'Form:PaymentChange';
	readonly addressEvent = 'Form:AddressChange';

	constructor(
		protected _container: HTMLFormElement,
		protected _events: IEventEmitter,
		action: (data?: unknown) => void
	) {
		super(_container, _events, action);
		this._payment = ensureAllElements(`.button_alt`, this._container);
		this._address = ensureElement<HTMLInputElement>(
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
		// Сделать выбранную кнопку акитвной, остальные деактивировать
		// Отправить событие
	}

	render(data: IDeliveryModel): HTMLElement {
		// Вернуть элемент
		return this._container;
	}
}

class ContactFormView extends Form implements IView {
	protected _phone: HTMLInputElement;
	protected _email: HTMLInputElement;

	readonly paymentEvent = 'Form:PhoneChange';
	readonly addressEvent = 'Form:EmailChange';

	constructor(
		protected _container: HTMLFormElement,
		protected _events: IEventEmitter,
		action: (data?: unknown) => void
	) {
		super(_container, _events, action);
		this._phone = null; // получить тел.
		this._email = null; // получить адрес

		// Уставноить обработчики событий
	}

	setPhone(value: string) {
		// Отправить событие
	}
	setEmail(value: string) {
		// Отправить событие
	}
	render(data: IContactModel): HTMLElement {
		// Вернуть элемент
		return this._container;
	}
}

class SuccessView implements IView {
	protected _title: HTMLElement;
	protected _description: HTMLElement;
	protected _button: HTMLButtonElement;

	constructor(
		protected _container: HTMLElement,
		protected _events: IEventEmitter,
		onClick: () => void
	) {
		this._title = null; // получить title
		this._description = null; // получить description
		this._button = null; // получить button

		// Уставноить обработчики событий
	}

	setTotal(value: string) {}

	render(data: IOrderResponseModel): HTMLElement {
		// Вернуть элемент
		return this._container;
	}
}
