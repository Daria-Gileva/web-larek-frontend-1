import './scss/styles.scss';

import { API_URL, CDN_URL } from './utils/constants';
import * as event from './components/base/events';
import * as type from './types/index';
import * as constants from './utils/constants';
import * as utils from './utils/utils';
import * as api from './components/base/api';

const templateCardCatalog = document.querySelector(
	'#card-catalog'
) as HTMLTemplateElement;
const templateOrderSuccess = document.querySelector('#success');
const templateCardPreview = document.querySelector(
	'#card-preview'
) as HTMLTemplateElement;
const templateCardBasket = document.querySelector(
	'#card-basket'
) as HTMLTemplateElement;
const templateBasket = document.querySelector('#basket') as HTMLTemplateElement;
const templateOrder = document.querySelector('#order');
const templateContacts = document.querySelector('#contacts');
const wrapper = document.querySelector('.page__wrapper') as HTMLElement;
const modalElement = document.querySelector('#modal-container') as HTMLElement;

const events = new event.EventEmitter();
const apiModel = new type.AppApi(CDN_URL, API_URL);

const modalView = new type.Modal(modalElement, events);
const catalogModel = new type.CatalogModel(events);
const pageView = new type.Page(wrapper, events);

const basketModel = new type.BasketModel(events);
const basketView = new type.BasketView(templateBasket, events);
// basketModal.render();

// events.on(basketModal.openEvent, () => {
// 	console.log(basketModal.openEvent);
// 	let productViews: Array<HTMLElement> = [];

// 	basketModel.items.forEach((element) => {
// 		productViews.push(
// 			new type.ProductView(templateCardBasket, events).render(element)
// 		);
// 	});

// 	basketModal.render(basketView.render(productViews));
// });

// function addToBasket(data: type.IProductModel) {
// 	basketModel.add(data);
// }

/********** Получаем данные с сервера **********/
apiModel
	.getProductList()
	.then(function (data: type.IProductModel[]) {
		catalogModel.setItems(data);
	})
	.catch((error) => console.log(error));

events.on(catalogModel.addEvent, (data: type.IProductModel[]) => {
	let productViews: Array<HTMLElement> = [];
	data.forEach((element) => {
		productViews.push(
			new type.ProductView(
				templateCardCatalog,
				events,
				'ProductCatalog'
			).render(element)
		);
	});
	pageView.render(productViews);
});

events.on('ProductCatalog:Action', (data: String) => {
	let product = catalogModel.getProduct(data);
	let productView = new type.ProductView(
		templateCardPreview,
		events,
		'ProductView'
	);
	modalView.render(productView.render(product));
	modalView.open();
});

events.on(modalView.closeEvent, () => {
	pageView.lock(false);
});

events.on(modalView.openEvent, () => {
	pageView.lock(true);
});

events.on('ProductView:Action', (data: String) => {
	let product = catalogModel.getProduct(data);
	basketModel.add(product);
});

events.on(basketModel.changeEvent, () => {
	pageView.updateCounter(basketModel.getCounter());
});

events.on(pageView.event, () => {
	let productViews: Array<HTMLElement> = [];
	basketModel.items.forEach((element) => {
		productViews.push(
			new type.ProductView(templateCardBasket, events, 'ProductBasket').render(
				element
			)
		);
	});

	modalView.render(basketView.render(productViews));
	modalView.open();

	events.on('ProductBasket:Action', (id: Number) => {
		basketModel.remove(id);
	});
});

// const apiModel = new ApiModel(CDN_URL, API_URL);
// const events = new EventEmitter();
// const dataModel = new DataModel(events);
// const modal = new Modal(ensureElement<HTMLElement>('#modal-container'), events);
// const basket = new Basket(templateBasket, events);
// const basketModel = new BasketModel();
// const formModel = new FormModel(events);
// const order = new Order(templateOrder, events);
// const contacts = new Contacts(templateContacts, events);

// /********** Добавление карточки товара в корзину **********/
// events.on('card:addBasket', () => {
// 	basketModel.setSelectedСard(dataModel.selectedСard); // добавить карточку товара в корзину
// 	basket.renderHeaderBasketCounter(basketModel.getCounter()); // отобразить количество товара на иконке корзины
// 	modal.close();
// });

// /********** Открытие модального окна корзины **********/
// events.on('basket:open', () => {
// 	basket.renderSumAllProducts(basketModel.getSumAllProducts()); // отобразить сумма всех продуктов в корзине
// 	let i = 0;
// 	basket.items = basketModel.basketProducts.map((item) => {
// 		const basketItem = new BasketItem(templateCardBasket, events, {
// 			onClick: () => events.emit('basket:basketItemRemove', item),
// 		});
// 		i = i + 1;
// 		return basketItem.render(item, i);
// 	});
// 	modal.content = basket.render();
// 	modal.render();
// });

// /********** Удаление карточки товара из корзины **********/
// events.on('basket:basketItemRemove', (item: IProductItem) => {
// 	basketModel.deleteCardToBasket(item);
// 	basket.renderHeaderBasketCounter(basketModel.getCounter()); // отобразить количество товара на иконке корзины
// 	basket.renderSumAllProducts(basketModel.getSumAllProducts()); // отобразить сумма всех продуктов в корзине
// 	let i = 0;
// 	basket.items = basketModel.basketProducts.map((item) => {
// 		const basketItem = new BasketItem(templateCardBasket, events, {
// 			onClick: () => events.emit('basket:basketItemRemove', item),
// 		});
// 		i = i + 1;
// 		return basketItem.render(item, i);
// 	});
// });

// /********** Открытие модального окна "способа оплаты" и "адреса доставки" **********/
// events.on('order:open', () => {
// 	modal.content = order.render();
// 	modal.render();
// 	formModel.items = basketModel.basketProducts.map((item) => item.id); // передаём список id товаров которые покупаем
// });

// events.on('order:paymentSelection', (button: HTMLButtonElement) => {
// 	formModel.payment = button.name;
// }); // передаём способ оплаты

// /********** Отслеживаем изменение в поле в вода "адреса доставки" **********/
// events.on(`order:changeAddress`, (data: { field: string; value: string }) => {
// 	formModel.setOrderAddress(data.field, data.value);
// });

// /********** Валидация данных строки "address" и payment **********/
// events.on('formErrors:address', (errors: Partial<IOrderForm>) => {
// 	const { address, payment } = errors;
// 	order.valid = !address && !payment;
// 	order.formErrors.textContent = Object.values({ address, payment })
// 		.filter((i) => !!i)
// 		.join('; ');
// });

// /********** Открытие модального окна "Email" и "Телефон" **********/
// events.on('contacts:open', () => {
// 	formModel.total = basketModel.getSumAllProducts();
// 	modal.content = contacts.render();
// 	modal.render();
// });

// /********** Отслеживаем изменение в полях вода "Email" и "Телефон" **********/
// events.on(`contacts:changeInput`, (data: { field: string; value: string }) => {
// 	formModel.setOrderData(data.field, data.value);
// });

// /********** Валидация данных строки "Email" и "Телефон" **********/
// events.on('formErrors:change', (errors: Partial<IOrderForm>) => {
// 	const { email, phone } = errors;
// 	contacts.valid = !email && !phone;
// 	contacts.formErrors.textContent = Object.values({ phone, email })
// 		.filter((i) => !!i)
// 		.join('; ');
// });

// /********** Открытие модального окна "Заказ оформлен" **********/
// events.on('success:open', () => {
// 	apiModel
// 		.postOrderLot(formModel.getOrderLot())
// 		.then((data) => {
// 			console.log(data); // ответ сервера
// 			const success = new Success(templateOrderSuccess, events);
// 			modal.content = success.render(basketModel.getSumAllProducts());
// 			basketModel.clearBasketProducts(); // очищаем корзину
// 			basket.renderHeaderBasketCounter(basketModel.getCounter()); // отобразить количество товара на иконке корзины
// 			modal.render();
// 		})
// 		.catch((error) => console.log(error));
// });

// events.on('success:close', () => modal.close());

// /********** Блокируем прокрутку страницы при открытие модального окна **********/
// events.on('modal:open', () => {
// 	modal.locked = true;
// });

// /********** Разблокируем прокрутку страницы при закрытие модального окна **********/
// events.on('modal:close', () => {
// 	modal.locked = false;
// });

// /********** Получаем данные с сервера **********/
// apiModel
// 	.getListProductCard()
// 	.then(function (data: IProductItem[]) {
// 		dataModel.productCards = data;
// 	})
// 	// .then(dataModel.setProductCards.bind(dataModel))
// 	.catch((error) => console.log(error));
