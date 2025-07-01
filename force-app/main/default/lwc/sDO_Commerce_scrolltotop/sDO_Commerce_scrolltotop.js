import { LightningElement, track } from 'lwc';

export default class sDO_Commerce_Scrolltotop extends LightningElement 
{
    @track oldscroll = 0;
    @track scrolldisabled = false;

    connectedCallback()
    {
        this.scrolltothetop();
    }

    renderedCallback() 
    {
        window.onscroll = () => 
        {
            //console.log('old scroll: ' + this.oldscroll + ' new scroll: ' + window.scrollY);
            if (Math.abs(window.scrollY  - this.oldscroll) > 250 && !this.scrolldisabled)
            {
                this.scrolldisabled = true;
                this.scrolltothetop();
            }
            this.oldscroll = window.scrollY;
            this.scrolldisabled = false;
        }
    }

    scrolltothetop()
    {
        const scrollOptions = {
            left: 0,
            top: 0,
            behavior: 'auto'
        }
        var is_chrome = navigator.userAgent.indexOf('Chrome') != -1;
        if (is_chrome)
        {
            window.scrollTo(scrollOptions);
        }
        else
        {
            window.scrollTo(0,0);
        }
    }
}