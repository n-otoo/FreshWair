package pm.configuration;

public class Configuration {
	//
	//The region of DynamoDB service to connect. e.g. "eu-west-1" for the region in Ireland.
	//
	//If this is set to "local", our DynamoDBUtil class will connect
	//to a local server at the URL specified by LOCAL_ENDPOINT below.
	//
	//public static final String REGION="local";

	//
	//Local DynamoDB server connection end-point
	//This is only used if REGION above is set to "local".
	//If your local DynamoDB server listen to a different port,
	//update the URL accordingly.
	//
	//public static final String LOCAL_ENDPOINT="http://localhost:8000";
	
	public static final String REGION="eu-west-2";
	public static final String LOCAL_ENDPOINT="https://dynamodb.eu-west-2.amazonaws.com";
}
