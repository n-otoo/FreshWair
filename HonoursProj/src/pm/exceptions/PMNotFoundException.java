package pm.exceptions;

import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.Status;

public class PMNotFoundException extends WebApplicationException {
	public PMNotFoundException(String id)
	{
	super(Response.status(404).entity("PM: " + id + " could not be found").type("text/plain").build());
	}

}
