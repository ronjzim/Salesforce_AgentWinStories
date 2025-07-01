export const COLUMNS = [
    {
        label: '',
        type: 'text',
        hideDefaultActions: true,
        initialWidth: 50,
    },
    {
        label: '',
        fieldName: 'productImage',
        type: 'productImage',
        typeAttributes: {
            imageUrl: { fieldName: 'imageUrl' },
            imageAltText: { fieldName: 'imageAltText' }
        },
        cellAttributes: { alignment: 'center' },
        hideDefaultActions: true,
        initialWidth: 75,
    },
    {
        label: 'Product Name',
        fieldName: 'productName',
        type: 'productName',
        typeAttributes: {
            productId: { fieldName: 'id' },
            productName: { fieldName: 'name' }
        },
        hideDefaultActions: true,
    },
    {
        label: 'Price',
        fieldName: 'productPrice',
        type: 'productPrice',
        typeAttributes: {
            productId: { fieldName: 'id' },
        },
        cellAttributes: { alignment: 'right' },
        hideDefaultActions: true,
        initialWidth: 200
    },
    {
        label: '',
        fieldName: 'addToCart',
        type: 'button',
        typeAttributes: {
            label: { fieldName: 'addToCartLabel' },
            name: 'AddToCart',
            disabled: { fieldName: 'disableAddToCart' }
        },
        cellAttributes: { alignment: 'right' },
        hideDefaultActions: true,
        initialWidth: 200
    }
]

export const filteredColumns = (filters) => {
    return COLUMNS.filter(column => {
        return column.fieldName === undefined || filters[column.fieldName];
    });
}