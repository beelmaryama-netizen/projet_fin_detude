export function withinHours(hours, start, end) {
 if (!hours) return true;
 if (!start || !end) return false;
 const parts = value => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto', weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(value));
 const a = parts(start), b = parts(end); const part = (p, name) => p.find(x => x.type === name)?.value;
 const time = p => part(p, 'hour') + ':' + part(p, 'minute');
 return ['year','month','day'].every(k => part(a,k) === part(b,k)) && hours.days.includes(['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(part(a,'weekday'))) && time(a) >= hours.start && time(b) <= hours.end;
}
