/**
 * An apex page controller that takes the user to the right start page based on credentials or lack thereof
 */
public with sharing class SDO_Community_LandingController {
    
    // Code we will invoke on page load.
    public PageReference forwardToStartPage() {
        return Network.communitiesLanding();
    }
    
    public SDO_Community_LandingController() {}
    
    // @IsTest(SeeAllData=true) 
    // public static void testCommunitiesLandingController() {
    //     // Instantiate a new controller with all parameters in the page
    //     SDO_Community_LandingController controller = new SDO_Community_LandingController();
    // }    
}