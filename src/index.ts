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
const templateCardPreview = document.querySelector(
	'#card-preview'
) as HTMLTemplateElement;
const templateCardBasket = document.querySelector(
	'#card-basket'
) as HTMLTemplateElement;
const templateBasket = document.querySelector('#basket') as HTMLTemplateElement;
const templateOrder = document.querySelector('#order') as HTMLTemplateElement;;
const templateContacts = document.querySelector('#contacts') as HTMLTemplateElement;;
const templateOrderSuccess = document.querySelector('#success') as HTMLTemplateElement;
const wrapper = document.querySelector('.page__wrapper') as HTMLElement;
const modalElement = document.querySelector('#modal-container') as HTMLElement;

const events = new event.EventEmitter();

const apiModel = new type.AppApi(CDN_URL, API_URL, ".png");
const catalogModel = new type.CatalogModel(events);
const basketModel = new type.BasketModel(events);
const deliveryModel = new type.DeliveryModel();
const contactModel = new type.ContactModel();

const modalView = new type.Modal(modalElement, events);
const pageView = new type.Page(wrapper, events);
const basketView = new type.BasketView(templateBasket, events);
const deliveryFormView = new type.DeliveryFormView(templateOrder, events)
const contactFormView = new type.ContactFormView(templateContacts, events)
const successView = new type.SuccessView(templateOrderSuccess, events)

let productView: type.ProductView;

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
	productView = new type.ProductView(
		templateCardPreview,
		events,
		'ProductView'
	);
	modalView.render(productView.render(product),'ProductView');
	productView.setActiveSubmit(!basketModel.isExist(product))
	modalView.open();
});

events.on('ProductView:Open', () => {
	pageView.lock(true);
});

events.on('ProductView:Close', () => {
	pageView.lock(false);
});

events.on('ProductView:Action', (data: String) => {
	let product = catalogModel.getProduct(data);
	basketModel.add(product);
	productView.setActiveSubmit(!basketModel.isExist(product))
});

function renderFillBasket(){
	let productViews: Array<HTMLElement> = [];
	let counter = 1;
	basketModel.items.forEach((element) => {
		productViews.push(
			new type.ProductView(templateCardBasket, events, 'ProductBasket').render(
				element,
				counter++
			)
		);
	});

	modalView.render(basketView.render(productViews), "Basket");
}

// Изменение корзины
events.on(basketModel.changeEvent, () => {
	pageView.updateCounter(basketModel.getCounter());
	basketView.updateTotalPrice(basketModel.getAllSum());
	basketView.setActiveSubmit(basketModel.getCounter().valueOf() > 0)
});

events.on('ProductBasket:Action', (id: Number)=>{
	basketModel.remove(id.valueOf() - 1);
});

events.on(pageView.event, () => {
	let productViews: Array<HTMLElement> = [];
	let counter = 1;
	basketModel.items.forEach((element) => {
		productViews.push(
			new type.ProductView(templateCardBasket, events, 'ProductBasket').render(
				element,
				counter++
			)
		);
	});

	modalView.render(basketView.render(productViews), "Basket");
	modalView.open();
});

events.on("Basket:Open", () => {
	pageView.lock(true);
	events.on(basketModel.changeEvent, renderFillBasket);
})

events.on("Basket:Close", ()=>{
	pageView.lock(false);
	events.off(basketModel.changeEvent, renderFillBasket);
})



events.on(basketView.submit, ()=>{
	if(basketModel.getCounter().valueOf() > 0){
		modalView.render(deliveryFormView.render(deliveryModel), "Delivery");
		deliveryFormView.setActiveSubmit(false);
		events.off(basketModel.changeEvent, renderFillBasket);
	}
})

events.on("Delivery:Close", () => {
	pageView.lock(false);
	deliveryModel.clear();
})


events.on("Delivery:Change", () => {
	let data = deliveryFormView.getValues();
	deliveryFormView.setActiveSubmit(deliveryModel.validate( data.payment, data.address));
})

events.on(deliveryFormView.submitEvent, () => {
	let data = deliveryFormView.getValues();
	deliveryModel.set(data.payment, data.address)
	modalView.render(contactFormView.render(contactModel), "Contacts");
	contactFormView.setActiveSubmit(false);
})

events.on("Contacts:Close", () => {
	deliveryModel.clear();
	contactModel.clear();
	pageView.lock(false);
})

events.on("Contacts:Change", () => {
	let data = contactFormView.getValues();
	contactFormView.setActiveSubmit(contactModel.validate(data.phone, data.email));
})

events.on(contactFormView.submitEvent, () => {
	let data = contactFormView.getValues();
	contactModel.set(data.phone, data.email)
	

	let orderRequestModel = new type.OrderRequestModel(deliveryModel, contactModel, basketModel)
	apiModel
		.order(orderRequestModel)
		.then(function (data: type.IOrderResponseModel) {
			modalView.render(successView.render(data), "Success");
		})
		.catch((error) => console.log(error));
})

events.on(successView.event, () => {
	basketModel.removeAll();
	deliveryModel.clear();
	contactModel.clear();
	modalView.close();
	pageView.lock(false);
})