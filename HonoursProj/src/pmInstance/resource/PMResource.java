package pmInstance.resource;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

//JAX-RS
import javax.ws.rs.*;
import javax.ws.rs.core.*;

//AWS SDK
import com.amazonaws.AmazonClientException;
import com.amazonaws.client.builder.AwsClientBuilder;
import com.amazonaws.client.builder.AwsClientBuilder.EndpointConfiguration;
import com.amazonaws.services.dynamodbv2.AmazonDynamoDB;
import com.amazonaws.services.dynamodbv2.AmazonDynamoDBClientBuilder;
import com.amazonaws.services.dynamodbv2.datamodeling.*;
import com.amazonaws.services.dynamodbv2.model.AttributeValue;

import pm.exceptions.*;
import pmInstance.model.PM;

@Path("/pm")
public class PMResource {

	@GET
	@Produces(MediaType.APPLICATION_JSON)
	@Path("/{id}")
	public PM getPMByID(@PathParam("id") String id) {
		// Retrieve a mapper to handle load and deletion
		DynamoDBMapper mapper = getMapper();

		// Declare an Appointment object
		PM pm;
		if ((pm = mapper.load(PM.class, id)) != null) {
			// return the appointment information
			// return Response.status(201).entity("Appointments found").build();
			return pm;
		} else {
			// If the appointment does not exists, return a 404 to denote there was no
			// appointment found
			throw new PMNotFoundException(id);
		}

	}
	
	
	@GET
	@Path("/all")
	@Produces(MediaType.APPLICATION_JSON)
	public List<PM> getAllPMData() {
		//Search the DB
		DynamoDBScanExpression expression = new DynamoDBScanExpression();

		//Retrieve a mapper to handle load and deletion 
		DynamoDBMapper mapper = getMapper();

		//Declare an Appointment object 
		List<PM> pms;
		if((pms = mapper.scan(PM.class, expression)).size() != 0) {
			// return the appointment information 
			return pms; 
		} else { 
			// If the appointment does not  exists,  return a 404 to denote there was no appointment found 
			throw new MultiPMNotFoundException("",""); 
		}

	}
	
	@GET
	@Path("/latest")
	@Produces(MediaType.APPLICATION_JSON)
	public PM getLatestData(@QueryParam("lat") double lat,
			@QueryParam("lon") double lon) {
		//Search the DB
		DynamoDBScanExpression expression = new DynamoDBScanExpression();

		//Retrieve a mapper to handle load and deletion 
		DynamoDBMapper mapper = getMapper();

		//Declare an Appointment object 
		List<PM> pms;
		if((pms = mapper.scan(PM.class, expression)).size() != 0) {
			List<PM> PMDataInTimeRangeAndDistance = new ArrayList<>();
			for(PM apm: pms) {
				if(comparePMDistance(apm, lat, lon) != null) {
					PMDataInTimeRangeAndDistance.add(apm);
				}
			}
			
			Collections.sort(PMDataInTimeRangeAndDistance, new Comparator<PM>() {
				public int compare(PM a, PM b) {
					return (int) (a.getDateTime() - b.getDateTime());
				}
			});
			// return the appointment information 
			if(!PMDataInTimeRangeAndDistance.isEmpty()) {
				return PMDataInTimeRangeAndDistance.get(PMDataInTimeRangeAndDistance.size() - 1);
			} else {
				throw new PMInLocationNotFoundException(lat, lon);
			}
		} else { 
			// If the appointment does not  exists,  return a 404 to denote there was no appointment found 
			throw new PMInLocationNotFoundException(lat, lon); 
		}
	}
	
	
	@GET
	@Produces(MediaType.APPLICATION_JSON)
	public List<PM> getPMDataInTimeRangeWithinKm(@QueryParam("startTime") String startTime,	  
			@QueryParam("endTime") String endTime,
			@QueryParam("lat") double lat,
			@QueryParam("lon") double lon) {
		
		//Validate Dates are Longs
		try { 
			java.lang.Long.parseLong(startTime);
			java.lang.Long.parseLong(endTime);
		} catch (Exception e) {
			throw new InvalidDateParameterException();
		}

			//Create a a scan expression to search through the DynamoDB
			Map<String,AttributeValue> eav = new HashMap<String,AttributeValue>(); 
			//We use "" + *Time to cast the int value to a string value 
			eav.put(":starttime",new AttributeValue().withN(startTime)); 
			eav.put(":endtime", new AttributeValue().withN(endTime)); 
			
			// Datetime and Owner are reserved words, therefore we must create this name mapping
			Map<String,String> ean = new HashMap<>();
			ean.put("#dt", "dateTime");
			
			//Search the DB
			DynamoDBScanExpression expression = new DynamoDBScanExpression()
					.withFilterExpression("#dt >= :starttime and #dt <= :endtime")
					.withExpressionAttributeValues(eav)
					.withExpressionAttributeNames(ean);
	
	
			//Retrieve a mapper to handle load and deletion 
			DynamoDBMapper mapper = getMapper();
	
			//Declare an Appointment object 
			List<PM> PMDataInTimeRange;
			if((PMDataInTimeRange = mapper.scan(PM.class, expression)).size() != 0) {
				// return the appointment information if it is less than 1km from current coordinates
				List<PM> PMDataInTimeRangeAndDistance = new ArrayList<>();
				for(PM apm: PMDataInTimeRange) {
					if(comparePMDistance(apm, lat, lon) != null) {
						PMDataInTimeRangeAndDistance.add(apm);
					}
				}
				return PMDataInTimeRangeAndDistance; 
			} else { 
				// If the appointment does not  exists,  return a 404 to denote there was no appointment found 
				throw new MultiPMNotFoundException(startTime, endTime); 
			}

	}

	@POST
	@Produces(MediaType.TEXT_PLAIN)
	public Response addPM(@FormParam("lat") double latitude, @FormParam("lon") double longitude,
			@FormParam("pm25") double pm25, @FormParam("pm10") double pm10, @FormParam("dateTime") String dateTime) {
		try {
			PM pm = new PM(generateID(), pm25, pm10, latitude, longitude, java.lang.Long.parseLong(dateTime));
			DynamoDBMapper mapper = getMapper();
			mapper.save(pm);

			// return 201 status code if everything is fine
			return Response.status(201).entity("PM for: " + pm25 + " - DateTime : " + dateTime + " created sucessfully").build(); // a successful reply
		} catch (Exception e) {
			// if there is an exception, return a 400 status code
			throw new CreatePMException(e);
		}
	}
	
	@POST
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.TEXT_PLAIN)
	@Path("/batch")
	public Response addMultiplePMs(List<PM> data) {
		try {
			DynamoDBMapper mapper = getMapper();
			for(PM pm: data) {
				PM instance = new PM(generateID(), pm.getPm25(), pm.getPm10(), pm.getLat(), pm.getLon(), pm.getDateTime());				
				mapper.save(instance);
			}

			// return 201 status code if everything is fine
			return Response.status(201).entity("Everything added successfully").build(); // a successful reply
		} catch (Exception e) {
			// if there is an exception, return a 400 status code
			throw new CreatePMException(e);
		}
	}



	private String generateID() {
		return UUID.randomUUID().toString();
	}

	private DynamoDBMapper getMapper() {
		AmazonDynamoDBClientBuilder builder = AmazonDynamoDBClientBuilder.standard();

		EndpointConfiguration epConfig = new AwsClientBuilder.EndpointConfiguration(
				pm.configuration.Configuration.LOCAL_ENDPOINT, pm.configuration.Configuration.REGION);

		builder.setEndpointConfiguration(epConfig);

		AmazonDynamoDB dbClient = builder.build();

		return new DynamoDBMapper(dbClient);

	}
	
	/**
	 * Calculate distance between two points in latitude and longitude taking
	 * into account height difference. If you are not interested in height
	 * difference pass 0.0. Uses Haversine method as its base.
	 * 
	 * lat1, lon1 Start point lat2, lon2 End point el1 Start altitude in meters
	 * el2 End altitude in meters
	 * @returns Distance in Kilometers
	 * 
	 * Function recieved from online
	 */
	public static double distance(double lat1, double lat2, double lon1,
	        double lon2, double el1, double el2) {

	    final int R = 6371; // Radius of the earth

	    double latDistance = Math.toRadians(lat2 - lat1);
	    double lonDistance = Math.toRadians(lon2 - lon1);
	    double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
	            + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
	            * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
	    double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	    double distance = R * c * 1000; // convert to meters

	    double height = el1 - el2;

	    distance = Math.pow(distance, 2) + Math.pow(height, 2);

	    return Math.sqrt(distance);
	}
	
	private PM comparePMDistance(PM instance, double lat, double lon) {		
		if(distance(instance.getLat(), lat, instance.getLon(), lon, 0.0, 0.0) < 1000) {
			return instance;
		} else {
			return null;
		}
	}

}
