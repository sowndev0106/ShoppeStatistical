var data = {};
$(function () {


    var selectMonthInYear = document.getElementById('statistical-with-month-in-year')
    var selectYear = document.getElementById('statistical-with-year')

    var selectMonthProduct = document.getElementById('statistical-with-month-product')
    var selectYearProduct = document.getElementById('statistical-with-year-product')

    $('#statistical-with-month-in-year').on('change', function () {
        data.time[this.value].year = this.value;
        showChart(data.time[this.value])
    });
    $('#statistical-with-year').on('change', function () {
        if (this.value == 0) {
            // statistical all
            showSummary(data.payableTotal, data.billQuantity, data.productQuantity, data.shippingFeeTotal, data.saveTotal);
        } else {
            // statistical all with year
            // console.log('value:', this.value)
            // console.log('summary:', this.billQuantity)
            showSummary(data.time[this.value].summary.payableTotal, data.time[this.value].summary.billQuantity, data.time[this.value].summary.productQuantity, data.time[this.value].summary.shippingFeeTotal, data.time[this.value].summary.saveTotal);
        }
    });


    $('#statistical-with-month-product').on('change', function () {
        var month = this.value
        var year = $('#statistical-with-year-product').val();
        // console.log({ year: year, month: month })
        showProductBoughtInMonthAndYear(month, year);

    });

    $('#statistical-with-year-product').on('change', function () {
        var month = $('#statistical-with-month-product').val();
        var year = this.value
        // console.log({ year: year, month: month })
        showProductBoughtInMonthAndYear(month, year);
        // console.log('value:', typeof month)

    });


    chrome.storage.local.get('result', function (e) {
        const monthNow = new Date().getMonth() + 1;
        const avatar = document.getElementById('avatar')
        data = e.result;
        // console.log(data)

        if (!data || !data.username) {
            console.log('Require login')
            document.getElementById('require-login').style.display = 'flex'
            document.getElementById('content').style.display = 'none'
            return;
        } else {
            document.getElementById('require-login').style.display = 'none'
            document.getElementById('content').style.display = 'block'
        }
        var time = data.time
        if (data.srcImage) {
            avatar.src = data.srcImage
        } else {
            avatar.src = ' img/undraw_profile.svg'
        }

        showSummary(data.payableTotal, data.billQuantity, data.productQuantity, data.shippingFeeTotal, data.saveTotal);
        const year = Object.keys(time)[Object.keys(time).length - 1]
        var arrFirstYear = time[year];
        if (!arrFirstYear) {
            return
        }
        arrFirstYear.year = year
        showChart(arrFirstYear);

        let option = ``
        for (const property in time) {
            option += `<option value="${property}">${property}</option> | `;
        }
        option = option.split('|').reverse().join('');
        selectMonthInYear.innerHTML = option;
        selectYear.innerHTML = '<option value="0">Từ trước đến nay</option> ' + option;
        selectYearProduct.innerHTML = option;
        selectMonthProduct.selectedIndex = monthNow - 1;



        showProductBoughtInMonthAndYear(monthNow, new Date().getUTCFullYear());


    })

})

function showSummary(total, bill, product, shippingFee, save) {
    const payableTotal = document.getElementById('payableTotal')
    const quantityBillAndProduct = document.getElementById('quantity-bill-and-product')
    const shippingFeeTotal = document.getElementById('shippingFeeTotal')
    const saveTotal = document.getElementById('saveTotal')
    payableTotal.innerHTML = pxgPrice(total) + ' VNĐ'
    quantityBillAndProduct.innerHTML = bill + ' Đơn - ' + product + ' Sản phẩm'
    shippingFeeTotal.innerHTML = pxgPrice(shippingFee) + ' VNĐ'
    saveTotal.innerHTML = pxgPrice(save) + ' VNĐ'
    // console.log({ total, bill, product, shippingFee, save })
    console.log('done')
}
function pxgPrice(number, fixed = 0) {
    if (isNaN(number)) return 0;
    number = number.toFixed(fixed);
    let delimeter = ',';
    number += '';
    let rgx = /(\d+)(\d{3})/;
    while (rgx.test(number)) {
        number = number.replace(rgx, '$1' + delimeter + '$2');
    }
    return number;
}
function showProductBoughtInMonthAndYear(month, year) {
    // console.log('month:', month, ' Year:', year)
    // console.log(data.time)
    const productHtml = document.getElementById('items')
    month -= 1;
    const obj = data.time[year + ''].stuff[month + ''];
    // console.log(obj)
    if (!obj || !obj.products || obj.products.length == 0) {
        productHtml.innerHTML = `
            <span class="  d-flex justify-content-center align-items-center  text-danger " style="font-size:15px">
             Bạn chưa mua gì trong tháng ${month + 1}/${year} </span>
        `
        return '';
    }

    var htmlProduct = obj.products.map(function (e) {
        var selectMonthProduct = document.getElementById('statistical-with-month-product')
        var selectYearProduct = document.getElementById('statistical-with-year-product')


        if (!e.name || e.model == undefined ) return ``;
        var name = e.name.length > 55 ? e.name.substring(0, 52) + '...' : e.name;
        var model = e.model.length > 30 ? e.model.substring(0, 30) + '...' : e.model;
        name = name.replace('-', ''); //  '3D - Khổ' => '3D---Kho'
        var urlProduct = 'https://shopee.vn/' + name.replace(/ +/g, '-') + '-i.' + e.shopId + '.' + e.itemId;

        return `
        <div class="row align-items-center item data-orderId=${e.orderId}">
        <div class="col-2  bg-gradient-light"
            style=" width: 100px; height: 50px; padding: 0; display: flex;">
            <img src="https://cf.shopee.vn/file/${e.image}"  class="card-img" alt="...">
        </div>
        <div class="col-8  d-flex lign-items-start flex-column justify-content-center pr-0">
            <a href="${urlProduct} " target="_blank" class="card-title text-dark mb-0 pb-0 " style="font-size:12px">
                ${name}
            </a>
            <small class=""  style="font-size:10px"> Loại hàng: ${model}</small>
            <span class="card-text text-danger" style="font-size:15px"> ${pxgPrice(e.price * e.amount)} VNĐ</span>
        </div>
        <div
            class="col-2 d-flex lign-items-start flex-column justify-content-center pl-0 pr-0">
            <p class="text-center " style="font-size:12px">X ${pxgPrice(e.amount)} </p>
            <a class="text-center" style="font-size:12px" href="https://shopee.vn/user/purchase/order/${e.orderId}" target="_blank" ><small>Đơn hàng
                </small></a>
        </div>
    </div>
        `
    })
    // <a href="https://shopee.vn/user/purchase/order/97992014540840" target="_blank"></a>
    productHtml.innerHTML = htmlProduct.join('')

}
