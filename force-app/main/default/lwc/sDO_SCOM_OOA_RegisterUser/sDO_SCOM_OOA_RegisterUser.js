import { LightningElement, track, api} from 'lwc';
import getDomains from "@salesforce/apex/SDO_SCOM_OOA_RegisterUser.getDomains";
import createRequest from "@salesforce/apex/SDO_SCOM_OOA_RegisterUser.createRequest";

export default class SDO_SCOM_OOA_RegisterUser extends LightningElement {

    @track email;
    @track allDomains = [];
    @track firstName;
    @track lastName;
    @track phone;
    @track role;
    @track accountId;
    disableBtn = true;
    submitBool = false;

    @api formTitle = 'Get Access to the Portal';

    connectedCallback() {
        getDomains()
        .then((result) => {
            this.allDomains = result;
            /* console.log(">>>>", this.allDomains); */
        })
        .catch((error) => {
            console.log(error);
        });
    }

    handleInputBlur() {
        var value;
        var emailInp = this.template.querySelector('lightning-input.email');
        this.email= emailInp.value;
        value = this.email.split('@');
        if(this.allDomains.filter(e => e.Name === value[1]).length === 0 && this.email !== null) {
            emailInp.setCustomValidity("Please enter a valid email address");
        } else {
            emailInp.setCustomValidity('');
        }
        emailInp.reportValidity();
         this.validateInputs();
    }

    handleOnChange(event){
        this[event.target.dataset.name] = event.target.value;
        this.validateInputs();
    }

    validateInputs() {
        this.disableBtn = [this.email, this.firstName, this.lastName, this.phone, this.accountId].some(value => !value);
    }

    onSubmit(){
        createRequest({accId:this.accountId, rFname:this.firstName, rLname:this.lastName, rEmail:this.email, rPhone:this.phone, rRole:this.role})
        .then(result=>{
            //console.log('requestRecoreId' + result.Id);
            this.submitBool = true;
        })
        .catch(error =>{
            console.log(error);
        });
    }

    submitAnotherRequest() {
        this.submitBool = false;
        this.accountId = this.name = this.email = this.phone = this.role = '';
        this.template.querySelector('lightning-input').forEach((input) => { input.value = ''; });
        this.validateInputs();
    }
}