package pm.exceptions;

import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.Status;

public class InvalidDateParameterException extends WebApplicationException {
	public InvalidDateParameterException()
	{
	super(Response.status(400).entity("DateTime or From or To Time Not in Correct Format").type("text/plain").build());
	}

}
