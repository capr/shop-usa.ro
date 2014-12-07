<h1>Multumim pentru comanda {{name}},</h1>

Comanda ta cu numarul
<b><a href="https://shop-usa.ro/comanda/{{{oid}}}">{{{oid}}}</a></b>
a fost inregistrata cu succes.

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
		<td>Telefon: </td><td><b>{{phone}}</b></td>
	</tr>
</table>

<h3>Produse:</h3>

<table>
	<tr>
		<th align=left>produs</th><th align=right>pret</th>
	</tr>
	{{#items}}
	<tr>
		<td>{{pid}} - {{{name}}} {{{combi}}}</td><td>{{{price}}} Lei</td>
	</tr>
	{{/items}}
</table>

<table>
	<tr>
		<td>Subtotal:       </td><td><b>{{subtotal}}</b> Lei</td>
		<td>Cost transport: </td><td><b>{{shipcost}}</b> Lei</td>
		<td>Total:          </td><td><b>{{total}}</b> Lei</td>
	</tr>
</table>

Pentru informatii despre starea comenzii, intra in
<a href="https://shop-usa.ro/cont">contul tau</a>
SHOP-USA.

O zi excelenta!
Echipa SHOP-USA
