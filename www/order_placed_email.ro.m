<h2>Multumim pentru comanda {{name}},</h2>

<b>Comanda ta cu numarul
<a href="https://shop-usa.ro/comanda/{{{oid}}}">{{{oid}}}</a>
a fost inregistrata cu succes.</b>

<h3>Livrare:</h3>

<b>{{shiptype}}</b>

{{#hasaddress}}
<h3>Adresa de livrare:</h3>

<b>{{addr}}, {{city}}, {{county}}</b>
{{/hasaddress}}

<h3>Plata:</h3>

<b>Cash la livrare</b>

<h3>Date de contact:</h3>

<table>
	<tr>
		<td>Nume:    </td><td><b>{{name}}</b></td>
	</tr><tr>
		<td>Telefon: </td><td><b>{{phone}}</b></td>
	</tr>
</table>

<h3>Produse:</h3>

<table>
	<tr>
		<th align=left>produs</th>
		<th align=right>pret</th>
	</tr>
	{{#items}}
	<tr>
		<td>{{pid}} - {{{name}}} {{{vnames}}}</td>
		<td><b>{{{price}}}</b> Lei</td>
	</tr>
	{{/items}}
</table>

<h3>Total de plata:</h3>

<table>
	<tr>
		<td>Subtotal:</td>
		<td align=right><b>{{subtotal}}</b> Lei</td>
	</tr>
	<tr>
		<td>Cost transport:</td>
		<td align=right><b>{{shipcost}}</b> Lei</td>
	</tr>
	<tr>
		<td><b>Total:</b></td>
		<td align=right><b>{{total}}</b> Lei</td>
	</tr>
</table>

<br>
<br>
Pentru informatii despre starea comenzii, intra in
<a href="https://shop-usa.ro/cont">contul tau</a>
SHOP-USA.
<br>
<br>

O zi excelenta!<br>
Echipa SHOP-USA
