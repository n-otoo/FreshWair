package pm.exceptions;

import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.Status;

public class MultiPMNotFoundException extends WebApplicationException {
	public MultiPMNotFoundException(String startTime, String endTime)
	{
	super(Response.status(404).entity("PM Data could not be found in this timerange: " + startTime +  " to " + endTime).type("text/plain").build());
	}

}
