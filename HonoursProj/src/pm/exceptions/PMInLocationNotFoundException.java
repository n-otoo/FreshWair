package pm.exceptions;

import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Response;

public class PMInLocationNotFoundException extends WebApplicationException {
	public PMInLocationNotFoundException(double lat, double lon)
	{
	super(Response.status(404)
			.entity("PM Data could not be found within 1km of the LatLong: " + lat +  " , " + lon)
			.type("text/plain")
			.build());
	}
}
