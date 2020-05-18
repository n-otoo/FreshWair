package pm.exceptions;

import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.Status;

public class CreatePMException extends WebApplicationException {
	public CreatePMException()
	{
	super(Response.status(400).entity("Something went wrong.").type("text/plain").build());
	}

	public CreatePMException(Exception e) {
		super(Response.status(400).entity("Something went wrong." + e.toString()).type("text/plain").build());
	}

}
