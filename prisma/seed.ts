import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

// High-quality CAT formulas for all 25 Quant subtopics
const quantFormulaSheets: Record<string, string> = {
  "Percentages": `<div class='space-y-4 text-slate-800 dark:text-slate-100'>
    <h3 class='text-xl font-bold border-b pb-2'>Percentages - CAT Cheatsheet</h3>
    <ul class='list-disc pl-5 space-y-2'>
      <li><strong>Fraction Conversion:</strong> 1/2 = 50%, 1/3 = 33.33%, 1/4 = 25%, 1/5 = 20%, 1/6 = 16.67%, 1/7 = 14.28%, 1/8 = 12.5%, 1/9 = 11.11%, 1/11 = 9.09%, 1/12 = 8.33%.</li>
      <li><strong>Percentage Change:</strong> Percentage Change = (Difference / Initial Value) &times; 100.</li>
      <li><strong>Successive Percentage Changes:</strong> If a value is changed by A% and then by B%, net change = <strong>A + B + (AB/100)%</strong>. (Use negative sign for decreases).</li>
      <li><strong>Product Constancy (x &times; y = Constant):</strong> If x increases by a/b, then y must decrease by <strong>a / (a + b)</strong> to keep the product constant.</li>
      <li><strong>Population Growth/Depreciation:</strong> Value after n years = P(1 &plusmn; r/100)<sup>n</sup>.</li>
    </ul>
  </div>`,
  "Profit and Loss": `<div class='space-y-4 text-slate-800 dark:text-slate-100'>
    <h3 class='text-xl font-bold border-b pb-2'>Profit, Loss & Discount - CAT Cheatsheet</h3>
    <ul class='list-disc pl-5 space-y-2'>
      <li><strong>Basic Relations:</strong> Profit% = [(SP - CP)/CP] &times; 100. Loss% = [(CP - SP)/CP] &times; 100.</li>
      <li><strong>Markup & Discount:</strong> MP = CP &times; (1 + Markup%). SP = MP &times; (1 - Discount%).</li>
      <li><strong>Markup/Discount/Profit Equation:</strong> <strong>Profit% = Markup% - Discount% - (Markup% &times; Discount% / 100)</strong>.</li>
      <li><strong>Dishonest Dealer:</strong> Profit% = (True Value - False Value) / False Value &times; 100. Or Profit% = (Goods Left / Goods Sold) &times; 100.</li>
      <li><strong>Successive Discounts:</strong> Equivalent discount of D1 and D2 = <strong>D1 + D2 - (D1 &times; D2 / 100)%</strong>.</li>
    </ul>
  </div>`,
  "Ratio and Proportion": `<div class='space-y-4 text-slate-800 dark:text-slate-100'>
    <h3 class='text-xl font-bold border-b pb-2'>Ratio, Proportion & Variation - CAT Cheatsheet</h3>
    <ul class='list-disc pl-5 space-y-2'>
      <li><strong>Proportions:</strong> If a:b = c:d, then ad = bc. Mean proportion of a and b = <strong>&radic;(ab)</strong>. Third proportion = <strong>b<sup>2</sup>/a</strong>.</li>
      <li><strong>Componendo & Dividendo:</strong> If a/b = c/d, then <strong>(a + b) / (a - b) = (c + d) / (c - d)</strong>.</li>
      <li><strong>Variations:</strong> If x &prop; y, then x = k*y. If x &prop; 1/y, then x*y = k.</li>
      <li><strong>Direct proportion shortcut:</strong> If price of diamond &prop; weight<sup>2</sup>, P = k*W<sup>2</sup>. If a diamond breaks into ratios a:b, calculate losses using squares of parts.</li>
    </ul>
  </div>`,
  "Averages": `<div class='space-y-4 text-slate-800 dark:text-slate-100'>
    <h3 class='text-xl font-bold border-b pb-2'>Averages - CAT Cheatsheet</h3>
    <ul class='list-disc pl-5 space-y-2'>
      <li><strong>Basic Average:</strong> Avg = Sum / n. Sum of first n natural numbers = n(n+1)/2. Sum of first n odd numbers = n<sup>2</sup>.</li>
      <li><strong>Weighted Average:</strong> Avg = (n1 &times; A1 + n2 &times; A2) / (n1 + n2).</li>
      <li><strong>Consecutive Numbers Avg:</strong> For any AP series, Average = <strong>(First Term + Last Term) / 2</strong>.</li>
      <li><strong>Average Speed:</strong> If distances are equal, Avg Speed = <strong>2 &times; s1 &times; s2 / (s1 + s2)</strong>. If times are equal, Avg Speed = (s1 + s2)/2.</li>
    </ul>
  </div>`,
  "Mixtures": `<div class='space-y-4 text-slate-800 dark:text-slate-100'>
    <h3 class='text-xl font-bold border-b pb-2'>Mixtures & Alligations - CAT Cheatsheet</h3>
    <ul class='list-disc pl-5 space-y-2'>
      <li><strong>Alligation Rule:</strong> (Quantity of Cheaper / Quantity of Dearer) = <strong>(Dearer Price - Mean Price) / (Mean Price - Cheaper Price)</strong>.</li>
      <li><strong>Removal and Replacement Formula:</strong> Final Concentration of original liquid = <strong>Initial Concentration &times; (1 - x / V)<sup>n</sup></strong>, where x = quantity removed, V = total volume, n = number of operations.</li>
      <li><strong>Venn Diagram / Mixture Analogy:</strong> Treat mixtures as weighted averages of their components.</li>
    </ul>
  </div>`,
  "Time and Work": `<div class='space-y-4 text-slate-800 dark:text-slate-100'>
    <h3 class='text-xl font-bold border-b pb-2'>Time & Work - CAT Cheatsheet</h3>
    <ul class='list-disc pl-5 space-y-2'>
      <li><strong>Work Formula:</strong> Work = Efficiency &times; Time. If A takes A days and B takes B days, together they take <strong>AB/(A+B)</strong> days.</li>
      <li><strong>Three Workers:</strong> A, B, and C together take <strong>ABC / (AB + BC + CA)</strong> days.</li>
      <li><strong>Efficiency vs Time:</strong> Time taken is inversely proportional to efficiency. If A is 3 times as efficient as B, A takes 1/3 of the time B takes.</li>
      <li><strong>Group Work Equation:</strong> <strong>(M1 &times; D1 &times; H1) / W1 = (M2 &times; D2 &times; H2) / W2</strong>, where M = men, D = days, H = hours, W = work done.</li>
      <li><strong>Pipes & Cisterns:</strong> Inlets do positive work (+1/A), outlets do negative work (-1/B).</li>
    </ul>
  </div>`,
  "Time Speed Distance": `<div class='space-y-4 text-slate-800 dark:text-slate-100'>
    <h3 class='text-xl font-bold border-b pb-2'>Time, Speed & Distance - CAT Cheatsheet</h3>
    <ul class='list-disc pl-5 space-y-2'>
      <li><strong>Basic Equation:</strong> Distance = Speed &times; Time. Convert km/hr to m/s by multiplying by <strong>5/18</strong>; m/s to km/hr by <strong>18/5</strong>.</li>
      <li><strong>Relative Speed:</strong> Same direction: <strong>|S1 - S2|</strong>. Opposite direction: <strong>S1 + S2</strong>.</li>
      <li><strong>Boats and Streams:</strong> Downstream speed D = U + V. Upstream speed U = U - V. Speed of boat U = (D + U)/2. Speed of stream V = (D - U)/2.</li>
      <li><strong>Circular Tracks:</strong> Time of first meeting = <strong>L / Relative Speed</strong>. Time of meeting at starting point = <strong>LCM(L/S1, L/S2)</strong>.</li>
      <li><strong>Escalators:</strong> Total steps = N = t &times; (Speed of Person &plusmn; Speed of Escalator).</li>
    </ul>
  </div>`,
  "SI and CI": `<div class='space-y-4 text-slate-800 dark:text-slate-100'>
    <h3 class='text-xl font-bold border-b pb-2'>SI & CI - CAT Cheatsheet</h3>
    <ul class='list-disc pl-5 space-y-2'>
      <li><strong>Simple Interest:</strong> SI = (P &times; R &times; T) / 100. Amount = P + SI.</li>
      <li><strong>Compound Interest:</strong> Amount A = P(1 + R/100)<sup>T</sup>.</li>
      <li><strong>Difference Formulas:</strong> Difference between CI and SI for 2 years = <strong>P(R/100)<sup>2</sup></strong>. For 3 years = <strong>P(R/100)<sup>2</sup> &times; (3 + R/100)</strong>.</li>
      <li><strong>Compounding Periods:</strong> For semi-annual compounding, rate becomes R/2 and time becomes 2T. For quarterly, R/4 and 4T.</li>
      <li><strong>Doubling Time (Rule of 72):</strong> Time to double money &approx; 72 / Interest Rate.</li>
    </ul>
  </div>`,
  "Linear Equations": `<div class='space-y-4 text-slate-800 dark:text-slate-100'>
    <h3 class='text-xl font-bold border-b pb-2'>Linear Equations - CAT Cheatsheet</h3>
    <ul class='list-disc pl-5 space-y-2'>
      <li><strong>System of Equations (a1x + b1y = c1; a2x + b2y = c2):</strong>
        <ul>
          <li>Unique Solution: <strong>a1/a2 &ne; b1/b2</strong>.</li>
          <li>Infinite Solutions: <strong>a1/a2 = b1/b2 = c1/c2</strong>.</li>
          <li>No Solution: <strong>a1/a2 = b1/b2 &ne; c1/c2</strong>.</li>
        </ul>
      </li>
      <li><strong>Positive Integer Solutions:</strong> For ax + by = c, where a and b are co-prime, if one solution is (x0, y0), other solutions are (x0 + bk, y0 - ak).</li>
      <li><strong>Number of non-negative integer solutions:</strong> Use partitions and dividers for linear inequalities.</li>
    </ul>
  </div>`,
  "Quadratic Equations": `<div class='space-y-4 text-slate-800 dark:text-slate-100'>
    <h3 class='text-xl font-bold border-b pb-2'>Quadratic Equations - CAT Cheatsheet</h3>
    <ul class='list-disc pl-5 space-y-2'>
      <li><strong>Roots Formula:</strong> For ax<sup>2</sup> + bx + c = 0, roots are x = <strong>[-b &plusmn; &radic;(b<sup>2</sup> - 4ac)] / 2a</strong>.</li>
      <li><strong>Sum and Product:</strong> Sum of roots (&alpha; + &beta;) = <strong>-b/a</strong>. Product of roots (&alpha;&beta;) = <strong>c/a</strong>.</li>
      <li><strong>Discriminant (D = b<sup>2</sup> - 4ac):</strong> If D > 0, roots are real and distinct. If D = 0, roots are real and equal. If D < 0, roots are imaginary.</li>
      <li><strong>Maximum/Minimum Value:</strong> If a > 0, quadratic has a minimum at x = -b/2a with value <strong>(4ac - b<sup>2</sup>)/4a</strong>. If a < 0, it has a maximum.</li>
      <li><strong>Descartes' Rule of Signs:</strong> Max positive real roots = number of sign changes in f(x). Max negative real roots = sign changes in f(-x).</li>
    </ul>
  </div>`,
  "Logarithms": `<div class='space-y-4 text-slate-800 dark:text-slate-100'>
    <h3 class='text-xl font-bold border-b pb-2'>Logarithms - CAT Cheatsheet</h3>
    <ul class='list-disc pl-5 space-y-2'>
      <li><strong>Product and Quotient Rules:</strong> log<sub>a</sub>(xy) = log<sub>a</sub>x + log<sub>a</sub>y. log<sub>a</sub>(x/y) = log<sub>a</sub>x - log<sub>a</sub>y.</li>
      <li><strong>Power Rule:</strong> log<sub>a</sub>(x<sup>k</sup>) = k &times; log<sub>a</sub>x. log<sub>(a<sup>n</sup>)</sub>x = (1/n) &times; log<sub>a</sub>x.</li>
      <li><strong>Base Change Rule:</strong> log<sub>a</sub>b = log<sub>c</sub>b / log<sub>c</sub>a. log<sub>a</sub>b = 1 / log<sub>b</sub>a.</li>
      <li><strong>Special Properties:</strong> a<sup>log<sub>c</sub>b</sup> = b<sup>log<sub>c</sub>a</sup>. log<sub>a</sub>a = 1. log<sub>a</sub>1 = 0.</li>
      <li><strong>Inequalities:</strong> If log<sub>a</sub>x > log<sub>a</sub>y, then: x > y if a > 1; x < y if 0 < a < 1.</li>
    </ul>
  </div>`,
  "Functions": `<div class='space-y-4 text-slate-800 dark:text-slate-100'>
    <h3 class='text-xl font-bold border-b pb-2'>Functions - CAT Cheatsheet</h3>
    <ul class='list-disc pl-5 space-y-2'>
      <li><strong>Even/Odd Functions:</strong> Even: f(-x) = f(x) (symmetric about y-axis). Odd: f(-x) = -f(x) (symmetric about origin).</li>
      <li><strong>Domain and Range:</strong> Domain is the set of all valid inputs. Range is the set of all outputs. Watch out for denominators &ne; 0 and roots &ge; 0.</li>
      <li><strong>Composite Functions:</strong> f(g(x)) or (f &bull; g)(x).</li>
      <li><strong>Periodic Functions:</strong> f(x + T) = f(x). Smallest positive T is the fundamental period.</li>
      <li><strong>Shifts:</strong> f(x) + c shifts up. f(x - c) shifts right.</li>
    </ul>
  </div>`,
  "Sequences and Series": `<div class='space-y-4 text-slate-800 dark:text-slate-100'>
    <h3 class='text-xl font-bold border-b pb-2'>Sequences & Series - CAT Cheatsheet</h3>
    <ul class='list-disc pl-5 space-y-2'>
      <li><strong>Arithmetic Progression (AP):</strong> T<sub>n</sub> = a + (n - 1)d. S<sub>n</sub> = (n/2)[2a + (n - 1)d] = n &times; Middle Term.</li>
      <li><strong>Geometric Progression (GP):</strong> T<sub>n</sub> = ar<sup>n-1</sup>. S<sub>n</sub> = a(1 - r<sup>n</sup>) / (1 - r). Infinite Sum S<sub>&infin;</sub> = <strong>a / (1 - r)</strong> (valid only for |r| < 1).</li>
      <li><strong>Harmonic Progression (HP):</strong> Terms are reciprocals of an AP.</li>
      <li><strong>Sum of Powers:</strong>
        <ul>
          <li>Sum of first n natural numbers = n(n+1)/2.</li>
          <li>Sum of squares = n(n+1)(2n+1)/6.</li>
          <li>Sum of cubes = [n(n+1)/2]<sup>2</sup>.</li>
        </ul>
      </li>
      <li><strong>AM-GM Inequality:</strong> AM &ge; GM. <strong>(a + b)/2 &ge; &radic;(ab)</strong>. Equality holds only when a = b.</li>
    </ul>
  </div>`,
  "Triangles": `<div class='space-y-4 text-slate-800 dark:text-slate-100'>
    <h3 class='text-xl font-bold border-b pb-2'>Triangles - CAT Cheatsheet</h3>
    <ul class='list-disc pl-5 space-y-2'>
      <li><strong>Area Formulas:</strong> Area = 1/2 &times; b &times; h = &radic;[s(s-a)(s-b)(s-c)] (Heron's) = 1/2 &times; ab &times; sin(C) = r &times; s (inradius r) = abc / 4R (circumradius R).</li>
      <li><strong>Trigonometric Rules:</strong> Sine Rule: a/sin A = b/sin B = c/sin C = 2R. Cosine Rule: cos A = (b<sup>2</sup> + c<sup>2</sup> - a<sup>2</sup>)/2bc.</li>
      <li><strong>Important Theorems:</strong>
        <ul>
          <li>Angle Bisector Theorem: AB/AC = BD/CD (where AD bisects angle A).</li>
          <li>Apollonius Theorem: AB<sup>2</sup> + AC<sup>2</sup> = 2(AD<sup>2</sup> + BD<sup>2</sup>) (where AD is the median to BC).</li>
          <li>Midpoint Theorem: Line connecting midpoints of two sides is parallel to the third side and half its length.</li>
        </ul>
      </li>
      <li><strong>Special Right Triangles:</strong> 30-60-90 (ratio 1 : &radic;3 : 2). 45-45-90 (ratio 1 : 1 : &radic;2).</li>
    </ul>
  </div>`,
  "Circles": `<div class='space-y-4 text-slate-800 dark:text-slate-100'>
    <h3 class='text-xl font-bold border-b pb-2'>Circles - CAT Cheatsheet</h3>
    <ul class='list-disc pl-5 space-y-2'>
      <li><strong>Basic Formulas:</strong> Area = &pi;r<sup>2</sup>. Circumference = 2&pi;r. Arc length = (&theta;/360) &times; 2&pi;r. Sector area = (&theta;/360) &times; &pi;r<sup>2</sup>.</li>
      <li><strong>Chord Theorems:</strong> Perpendicular from center bisects the chord. Equal chords are equidistant from center.</li>
      <li><strong>Angle Properties:</strong> Angle subtended by arc at center is twice that at circumference. Angle in semicircle is 90&deg;.</li>
      <li><strong>Secant and Tangent Theorems:</strong>
        <ul>
          <li>Intersecting Chords: PA &times; PB = PC &times; PD (inside or outside).</li>
          <li>Tangent-Secant: PT<sup>2</sup> = PA &times; PB (where PT is a tangent, PAB is a secant).</li>
        </ul>
      </li>
      <li><strong>Common Tangents:</strong> Direct Common Tangent DCT = &radic;[d<sup>2</sup> - (r1 - r2)<sup>2</sup>]. Transverse Common Tangent TCT = &radic;[d<sup>2</sup> - (r1 + r2)<sup>2</sup>], where d = distance between centers.</li>
    </ul>
  </div>`,
  "Polygons": `<div class='space-y-4 text-slate-800 dark:text-slate-100'>
    <h3 class='text-xl font-bold border-b pb-2'>Polygons - CAT Cheatsheet</h3>
    <ul class='list-disc pl-5 space-y-2'>
      <li><strong>Angle Sums:</strong> Sum of interior angles of n-sided polygon = <strong>(n - 2) &times; 180&deg;</strong>. Sum of exterior angles = <strong>360&deg;</strong>.</li>
      <li><strong>Regular Polygons:</strong> Each interior angle = [(n - 2) &times; 180] / n. Each exterior angle = 360 / n.</li>
      <li><strong>Diagonals:</strong> Number of diagonals = <strong>n(n - 3) / 2</strong>.</li>
      <li><strong>Area of Regular Hexagon:</strong> Area = <strong>3&radic;3 / 2 &times; a<sup>2</sup></strong> (comprises 6 equilateral triangles).</li>
      <li><strong>Area of Regular Octagon:</strong> Area = <strong>2(1 + &radic;2) &times; a<sup>2</sup></strong>.</li>
    </ul>
  </div>`,
  "Coordinate Geometry": `<div class='space-y-4 text-slate-800 dark:text-slate-100'>
    <h3 class='text-xl font-bold border-b pb-2'>Coordinate Geometry - CAT Cheatsheet</h3>
    <ul class='list-disc pl-5 space-y-2'>
      <li><strong>Distance & Midpoint:</strong> Distance = &radic;[(x2 - x1)<sup>2</sup> + (y2 - y1)<sup>2</sup>]. Midpoint = ((x1+x2)/2, (y1+y2)/2).</li>
      <li><strong>Section Formula:</strong> Internally: ((mx2+nx1)/(m+n), (my2+ny1)/(m+n)).</li>
      <li><strong>Slope of Line (m):</strong> m = (y2 - y1) / (x2 - x1) = -a/b (for ax + by + c = 0).</li>
      <li><strong>Parallel & Perpendicular Lines:</strong> Parallel lines have m1 = m2. Perpendicular lines have <strong>m1 &times; m2 = -1</strong>.</li>
      <li><strong>Perpendicular Distance:</strong> Distance from (x0, y0) to ax + by + c = 0 is <strong>|ax0 + by0 + c| / &radic;(a<sup>2</sup> + b<sup>2</sup>)</strong>.</li>
    </ul>
  </div>`,
  "Mensuration": `<div class='space-y-4 text-slate-800 dark:text-slate-100'>
    <h3 class='text-xl font-bold border-b pb-2'>Mensuration 3D - CAT Cheatsheet</h3>
    <ul class='list-disc pl-5 space-y-2'>
      <li><strong>Cuboid:</strong> Volume = lwh. Total Surface Area TSA = 2(lw + wh + lh). Diagonal = &radic;(l<sup>2</sup> + w<sup>2</sup> + h<sup>2</sup>).</li>
      <li><strong>Cylinder:</strong> Volume = &pi;r<sup>2</sup>h. Curved Surface Area CSA = 2&pi;rh. TSA = 2&pi;r(r + h).</li>
      <li><strong>Cone:</strong> Volume = 1/3 &pi;r<sup>2</sup>h. CSA = &pi;rl (slant height l = &radic;[r<sup>2</sup> + h<sup>2</sup>]). TSA = &pi;r(r + l).</li>
      <li><strong>Sphere:</strong> Volume = 4/3 &pi;r<sup>3</sup>. Surface Area = 4&pi;r<sup>2</sup>.</li>
      <li><strong>Hemisphere:</strong> Volume = 2/3 &pi;r<sup>3</sup>. CSA = 2&pi;r<sup>2</sup>. TSA = 3&pi;r<sup>2</sup>.</li>
    </ul>
  </div>`,
  "Properties of Numbers": `<div class='space-y-4 text-slate-800 dark:text-slate-100'>
    <h3 class='text-xl font-bold border-b pb-2'>Properties of Numbers - CAT Cheatsheet</h3>
    <ul class='list-disc pl-5 space-y-2'>
      <li><strong>Number of Factors:</strong> For N = p<sup>a</sup> &times; q<sup>b</sup> &times; r<sup>c</sup> (prime factorization), Number of factors = <strong>(a+1)(b+1)(c+1)</strong>.</li>
      <li><strong>Sum of Factors:</strong> Sum = [(p<sup>a+1</sup> - 1)/(p - 1)] &times; [(q<sup>b+1</sup> - 1)/(q - 1)] &times; ...</li>
      <li><strong>Product of Factors:</strong> Product = <strong>N<sup>(Number of Factors / 2)</sup></strong>.</li>
      <li><strong>Odd/Even Factors:</strong> To find odd factors, ignore the power of 2. Even factors = Total factors - Odd factors.</li>
      <li><strong>Number of Prime Factors:</strong> For N = p<sup>a</sup> &times; q<sup>b</sup>, prime factors count is 2 (p, q). Total prime factors = a + b.</li>
    </ul>
  </div>`,
  "Divisibility Rules": `<div class='space-y-4 text-slate-800 dark:text-slate-100'>
    <h3 class='text-xl font-bold border-b pb-2'>Divisibility Rules - CAT Cheatsheet</h3>
    <ul class='list-disc pl-5 space-y-2'>
      <li><strong>Rule for 3 & 9:</strong> Sum of digits is divisible by 3 or 9.</li>
      <li><strong>Rule for 4 & 8:</strong> 4: Last 2 digits divisible by 4. 8: Last 3 digits divisible by 8.</li>
      <li><strong>Rule for 6:</strong> Divisible by both 2 and 3.</li>
      <li><strong>Rule for 11:</strong> Absolute difference of sum of odd-placed digits and sum of even-placed digits is 0 or a multiple of 11.</li>
      <li><strong>Co-prime Rule:</strong> If N is divisible by a and b (where a, b are co-prime), N is divisible by a &times; b.</li>
    </ul>
  </div>`,
  "LCM and HCF": `<div class='space-y-4 text-slate-800 dark:text-slate-100'>
    <h3 class='text-xl font-bold border-b pb-2'>LCM & HCF - CAT Cheatsheet</h3>
    <ul class='list-disc pl-5 space-y-2'>
      <li><strong>Product Rule:</strong> For two numbers A and B, <strong>A &times; B = HCF(A,B) &times; LCM(A,B)</strong>.</li>
      <li><strong>Fractions:</strong> HCF of fractions = HCF(Numerators) / LCM(Denominators). LCM of fractions = LCM(Numerators) / HCF(Denominators).</li>
      <li><strong>AP General Form:</strong> LCM(a, b) repeats every LCM period.</li>
      <li><strong>Standard Word Problems:</strong>
        <ul>
          <li>Find largest number dividing X, Y, Z leaving same remainder: HCF(|X-Y|, |Y-Z|, |Z-X|).</li>
          <li>Find smallest number which when divided by X, Y, Z leaves remainder R: LCM(X,Y,Z) + R.</li>
        </ul>
      </li>
    </ul>
  </div>`,
  "Remainders": `<div class='space-y-4 text-slate-800 dark:text-slate-100'>
    <h3 class='text-xl font-bold border-b pb-2'>Remainders - CAT Cheatsheet</h3>
    <ul class='list-disc pl-5 space-y-2'>
      <li><strong>Fermat's Little Theorem:</strong> A<sup>p-1</sup> &equiv; 1 (mod p) where p is a prime and HCF(A, p) = 1.</li>
      <li><strong>Euler's Theorem:</strong> A<sup>&phi;(N)</sup> &equiv; 1 (mod N) where &phi;(N) = N(1 - 1/p)(1 - 1/q)... (Euler's Totient).</li>
      <li><strong>Wilson's Theorem:</strong> (p - 1)! &equiv; -1 (mod p) where p is a prime. (p - 2)! &equiv; 1 (mod p).</li>
      <li><strong>Remainder Properties:</strong> Rem[(A &times; B)/N] = [Rem(A/N) &times; Rem(B/N)] mod N.</li>
      <li><strong>Negative Remainders:</strong> Useful shortcut: 25 mod 26 = -1 &equiv; 25.</li>
    </ul>
  </div>`,
  "Permutation and Combination": `<div class='space-y-4 text-slate-800 dark:text-slate-100'>
    <h3 class='text-xl font-bold border-b pb-2'>P&C - CAT Cheatsheet</h3>
    <ul class='list-disc pl-5 space-y-2'>
      <li><strong>Factorials:</strong> n! = n &times; (n-1)... &times; 1. 0! = 1.</li>
      <li><strong>Permutations (Arrangements):</strong> nPr = n! / (n - r)!. Circle permutations = <strong>(n - 1)!</strong>. Necklaces/keychains = (n - 1)! / 2.</li>
      <li><strong>Combinations (Selections):</strong> nCr = n! / [r! &times; (n - r)!]. nCr = nC(n-r).</li>
      <li><strong>Distribution of Identical Objects (Beggars Method):</strong> Number of ways to distribute n identical items among r people:
        <ul>
          <li>Non-negative integers (can get zero): <strong><sup>n+r-1</sup>C<sub>r-1</sub></strong>.</li>
          <li>Positive integers (at least one each): <strong><sup>n-1</sup>C<sub>r-1</sub></strong>.</li>
        </ul>
      </li>
      <li><strong>Derangements:</strong> Number of ways to arrange n items such that none go to their designated place: D<sub>n</sub> = n![1 - 1/1! + 1/2! - 1/3! ... + (-1)<sup>n</sup>/n!]. D3 = 2, D4 = 9, D5 = 44.</li>
    </ul>
  </div>`,
  "Probability": `<div class='space-y-4 text-slate-800 dark:text-slate-100'>
    <h3 class='text-xl font-bold border-b pb-2'>Probability - CAT Cheatsheet</h3>
    <ul class='list-disc pl-5 space-y-2'>
      <li><strong>Basic Probability:</strong> P(A) = Favorable Outcomes / Total Outcomes. 0 &le; P(A) &le; 1.</li>
      <li><strong>Addition Rule:</strong> P(A &cup; B) = P(A) + P(B) - P(A &cap; B). If mutually exclusive, P(A &cap; B) = 0.</li>
      <li><strong>Independent Events:</strong> P(A &cap; B) = P(A) &bull; P(B).</li>
      <li><strong>Conditional Probability:</strong> P(A|B) = P(A &cap; B) / P(B).</li>
      <li><strong>Odds:</strong> Odds in favor of A = P(A) : P(A'). Odds against A = P(A') : P(A).</li>
      <li><strong>Bayes' Theorem:</strong> P(Ai|B) = [P(B|Ai)P(Ai)] / [&Sigma; P(B|Aj)P(Aj)].</li>
    </ul>
  </div>`,
  "Set Theory": `<div class='space-y-4 text-slate-800 dark:text-slate-100'>
    <h3 class='text-xl font-bold border-b pb-2'>Set Theory & Venn Diagrams - CAT Cheatsheet</h3>
    <ul class='list-disc pl-5 space-y-2'>
      <li><strong>Two Sets:</strong> n(A &cup; B) = n(A) + n(B) - n(A &cap; B).</li>
      <li><strong>Three Sets:</strong> n(A &cup; B &cup; C) = n(A) + n(B) + n(C) - n(A &cap; B) - n(B &cap; C) - n(C &cap; A) + n(A &cap; B &cap; C).</li>
      <li><strong>Venn Terminology:</strong>
        <ul>
          <li>Exactly 1 set = a + b + c.</li>
          <li>Exactly 2 sets = d + e + f.</li>
          <li>Exactly 3 sets = g (center).</li>
          <li>At least 1 set = Exactly 1 + Exactly 2 + Exactly 3.</li>
        </ul>
      </li>
      <li><strong>Maxima and Minima:</strong> Minimum value of intersection (A &cap; B) = max(0, n(A) + n(B) - Total).</li>
    </ul>
  </div>`,
};

const varcFormulaSheets: Record<string, string> = {
  "Science & Technology RC": `<div class='space-y-4'><h3 class='text-xl font-bold border-b pb-2'>Science & Tech RC — CAT Strategy</h3><ul class='list-disc pl-5 space-y-2 text-sm'><li><strong>Passage structure:</strong> Identify thesis (para 1), evidence (middle), conclusion (last).</li><li><strong>Inference questions:</strong> Answer must be supported by text — eliminate options adding new facts.</li><li><strong>Tone markers:</strong> skeptical, optimistic, critical — track adjectives and qualifiers.</li><li><strong>Speed tip:</strong> Read first & last para, skim middle for data/examples, then attack questions.</li></ul></div>`,
  "History & Culture RC": `<div class='space-y-4'><h3 class='text-xl font-bold border-b pb-2'>History & Culture RC — CAT Strategy</h3><ul class='list-disc pl-5 space-y-2 text-sm'><li><strong>Chronology trap:</strong> CAT often swaps cause-effect order — verify timeline in passage.</li><li><strong>Author's view vs facts:</strong> Distinguish historical facts from author's interpretation.</li><li><strong>Main idea:</strong> Usually about a broader theme (decline, transformation, debate).</li><li><strong>Vocabulary:</strong> Context-clue unknown words — don't need full dictionary meaning.</li></ul></div>`,
  "Philosophy RC": `<div class='space-y-4'><h3 class='text-xl font-bold border-b pb-2'>Philosophy RC — CAT Strategy</h3><ul class='list-disc pl-5 space-y-2 text-sm'><li><strong>Abstract passages:</strong> Map each paragraph to one idea — label mentally (P1=definition, P2=critique).</li><li><strong>Para-summary Qs:</strong> Must capture scope + limitation; reject over-broad options.</li><li><strong>Logical connectors:</strong> however, therefore, nevertheless signal argument shifts.</li><li><strong>Easiest approach:</strong> Eliminate options contradicting any explicit sentence.</li></ul></div>`,
  "Economics RC": `<div class='space-y-4'><h3 class='text-xl font-bold border-b pb-2'>Economics RC — CAT Strategy</h3><ul class='list-disc pl-5 space-y-2 text-sm'><li><strong>Data questions:</strong> Locate numbers in passage — CAT rarely requires calculation.</li><li><strong>Policy arguments:</strong> Identify stakeholder (government, consumers, firms).</li><li><strong>Cause-effect chains:</strong> Draw quick flow: A → B → C before reading options.</li><li><strong>Trap:</strong> Options using real-world knowledge not in passage — always reject.</li></ul></div>`,
  "Para Summary": `<div class='space-y-4'><h3 class='text-xl font-bold border-b pb-2'>Para Summary — CAT Cheatsheet</h3><ul class='list-disc pl-5 space-y-2 text-sm'><li><strong>Best summary</strong> = complete scope + correct tone + no new information.</li><li><strong>Mini-map:</strong> Sentence 1 = context, middle = development, last = conclusion/limit.</li><li><strong>Eliminate:</strong> Too narrow (one detail), too broad (beyond passage), distorted (wrong causality).</li><li><strong>Odd sentence out:</strong> Find the sentence that breaks the logical chain.</li></ul></div>`,
  "Para Jumbles": `<div class='space-y-4'><h3 class='text-xl font-bold border-b pb-2'>Para Jumbles — CAT Cheatsheet</h3><ul class='list-disc pl-5 space-y-2 text-sm'><li><strong>Anchor sentence:</strong> Opening (no pronoun back-reference) or closing (hence, therefore, thus).</li><li><strong>Mandatory pairs:</strong> Pronoun chain (he/they → prior noun), chronology, definition → example.</li><li><strong>Linkers:</strong> However/But follow contrast setup; Moreover/Furthermore follow base claim.</li><li><strong>4-sentence TITA:</strong> Find 2 fixed positions first — reduces permutations drastically.</li></ul></div>`,
  "Odd One Out": `<div class='space-y-4'><h3 class='text-xl font-bold border-b pb-2'>Odd One Out — CAT Cheatsheet</h3><ul class='list-disc pl-5 space-y-2 text-sm'><li><strong>Find the cluster:</strong> 3 sentences share theme/register/structure — 1 diverges.</li><li><strong>Check dimensions:</strong> time period, subject, tone (formal vs anecdotal), logical role.</li><li><strong>Not grammar:</strong> CAT tests coherence, not comma rules.</li><li><strong>Fast method:</strong> Read shortest sentence last — often the outlier.</li></ul></div>`,
};

const lrdiFormulaSheets: Record<string, string> = {
  "Arrangement": `<div class='space-y-4'><h3 class='text-xl font-bold border-b pb-2'>Arrangement — CAT Strategy</h3><ul class='list-disc pl-5 space-y-2 text-sm'><li><strong>Linear vs Circular:</strong> Circular: n people → (n-1)! arrangements; fix one position to linearize.</li><li><strong>Grid method:</strong> Draw slots, fill certainties first, branch on remaining cases.</li><li><strong>Opposite/adjacent:</strong> In circular, opposite = n/2 seats apart (n even).</li><li><strong>Easiest approach:</strong> List all "X is left/right of Y" as inequalities on number line.</li></ul></div>`,
  "Games and Tournaments": `<div class='space-y-4'><h3 class='text-xl font-bold border-b pb-2'>Games & Tournaments — CAT Strategy</h3><ul class='list-disc pl-5 space-y-2 text-sm'><li><strong>Round robin:</strong> Matches = n(n-1)/2. Points tie-breakers need extra constraints.</li><li><strong>Knockout:</strong> Matches = n - 1 for single elimination.</li><li><strong>Win/Draw/Loss:</strong> Total points distributed = 2 × matches (if win=2, draw=1).</li><li><strong>Shortcut:</strong> Build points table early; max/min possible points for each player.</li></ul></div>`,
  "Selection": `<div class='space-y-4'><h3 class='text-xl font-bold border-b pb-2'>Selection — CAT Strategy</h3><ul class='list-disc pl-5 space-y-2 text-sm'><li><strong>At least one of A/B:</strong> Total valid teams − teams with neither A nor B.</li><li><strong>Conditional selection:</strong> If P selected → Q not selected: split into P-case and not-P-case.</li><li><strong>Together-or-not:</strong> Treat paired people as a block or both absent.</li><li><strong>Enumeration:</strong> For small pools (≤6), systematic case listing beats complex formulas.</li></ul></div>`,
  "Distribution": `<div class='space-y-4'><h3 class='text-xl font-bold border-b pb-2'>Distribution — CAT Strategy</h3><ul class='list-disc pl-5 space-y-2 text-sm'><li><strong>Identical items:</strong> Stars and bars — (n+r-1)C(r-1) for non-negative distribution to r people.</li><li><strong>Minimum 1 each:</strong> Give 1 to each first, then distribute remainder freely.</li><li><strong>Distinct items:</strong> Use multinomial or casework on who gets what.</li><li><strong>Verify:</strong> Sum of distributed amounts must equal total given in problem.</li></ul></div>`,
  "Venn Diagram": `<div class='space-y-4'><h3 class='text-xl font-bold border-b pb-2'>Venn Diagrams — CAT Cheatsheet</h3><ul class='list-disc pl-5 space-y-2 text-sm'><li><strong>2 sets:</strong> n(A∪B) = n(A) + n(B) − n(A∩B). Neither = Total − n(A∪B).</li><li><strong>3 sets:</strong> n(A∪B∪C) = sum singles − sum doubles + triple overlap.</li><li><strong>Exactly 2:</strong> Do not confuse with "at least 2" (includes exactly 3).</li><li><strong>Max intersection:</strong> min(n(A), n(B)). Min: max(0, n(A)+n(B)−Total).</li></ul></div>`,
  "Caselets": `<div class='space-y-4'><h3 class='text-xl font-bold border-b pb-2'>Caselets / DI — CAT Strategy</h3><ul class='list-disc pl-5 space-y-2 text-sm'><li><strong>Tabulate first:</strong> Convert prose to table before reading questions.</li><li><strong>Percentage change:</strong> (New−Old)/Old × 100 — watch base year in multi-year data.</li><li><strong>Approximation:</strong> CAT rewards smart rounding when options are far apart.</li><li><strong>Unit check:</strong> lakhs vs crores, % vs absolute — most common trap.</li></ul></div>`,
  "Mixed Sets": `<div class='space-y-4'><h3 class='text-xl font-bold border-b pb-2'>Mixed LRDI Sets — CAT Strategy</h3><ul class='list-disc pl-5 space-y-2 text-sm'><li><strong>Set selection:</strong> Spend 2 min scanning all 4 sets — pick 2 easiest first.</li><li><strong>Variable reduction:</strong> Fix one entity early to collapse branches.</li><li><strong>Partial solving:</strong> Some questions need only a subset of constraints.</li><li><strong>Time cap:</strong> ~12–14 min per set in exam; move on if stuck 4+ min on one question.</li></ul></div>`,
};

// Seeding Main Function
async function main() {
  console.log("Starting DB seeding...");

  // 1. Clean Database
  await prisma.examSession.deleteMany({});
  await prisma.attemptSectionScore.deleteMany({});
  await prisma.achievement.deleteMany({});
  await prisma.userAnalytics.deleteMany({});
  await prisma.dailyGoalProgress.deleteMany({});
  await prisma.userProgress.deleteMany({});
  await prisma.bookmark.deleteMany({});
  await prisma.attemptAnswer.deleteMany({});
  await prisma.attempt.deleteMany({});
  await prisma.testQuestion.deleteMany({});
  await prisma.test.deleteMany({});
  await prisma.catPyqQuestion.deleteMany({});
  await prisma.catPyqSection.deleteMany({});
  await prisma.catPyqPaper.deleteMany({});
  await prisma.option.deleteMany({});
  await prisma.question.deleteMany({});
  await prisma.formulaSheet.deleteMany({});
  await prisma.subtopic.deleteMany({});
  await prisma.topic.deleteMany({});
  await prisma.rCPassage.deleteMany({});
  await prisma.lRDISet.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("Database cleared.");

  // 2. Create demo users (opt-in — disable in production)
  const seedDemoUsers = process.env.SEED_DEMO_USERS === "true";
  let defaultUser: { id: string } | null = null;

  if (seedDemoUsers) {
    const hashedPassword = await bcrypt.hash("password123", 10);
    defaultUser = await prisma.user.create({
      data: {
        name: "Aspirant Warrior",
        email: "user@test.com",
        password: hashedPassword,
        role: "USER",
        streak: 5,
        lastActive: new Date(),
      },
    });

    await prisma.user.create({
      data: {
        name: "Admin Coach",
        email: "admin@test.com",
        password: hashedPassword,
        role: "ADMIN",
      },
    });

    console.log("Demo users created (user@test.com, admin@test.com).");
  } else {
    console.log("Skipping demo users. Set SEED_DEMO_USERS=true to seed demo accounts.");
  }

  // 3. Create Topics & Subtopics Config
  const quantTopics = [
    { name: "Arithmetic", subtopics: ["Percentages", "Profit and Loss", "Ratio and Proportion", "Averages", "Mixtures", "Time and Work", "Time Speed Distance", "SI and CI"] },
    { name: "Algebra", subtopics: ["Linear Equations", "Quadratic Equations", "Logarithms", "Functions", "Sequences and Series"] },
    { name: "Geometry", subtopics: ["Triangles", "Circles", "Polygons", "Coordinate Geometry", "Mensuration"] },
    { name: "Number System", subtopics: ["Properties of Numbers", "Divisibility Rules", "LCM and HCF", "Remainders"] },
    { name: "Modern Math", subtopics: ["Permutation and Combination", "Probability", "Set Theory"] },
  ];

  const varcTopics = [
    { name: "Reading Comprehension", subtopics: ["Science & Technology RC", "History & Culture RC", "Philosophy RC", "Economics RC"] },
    { name: "Verbal Ability", subtopics: ["Para Summary", "Para Jumbles", "Odd One Out"] },
  ];

  const lrdiTopics = [
    { name: "Logical Reasoning", subtopics: ["Arrangement", "Games and Tournaments", "Selection", "Distribution"] },
    { name: "Data Interpretation", subtopics: ["Venn Diagram", "Caselets", "Mixed Sets"] },
  ];

  // Helper Maps
  const subtopicMap: Record<string, string> = {};
  const subtopicsList: { id: string; name: string; category: string }[] = [];

  // Seed QUANT
  for (const t of quantTopics) {
    const topicObj = await prisma.topic.create({ data: { name: t.name, category: "QUANT" } });
    for (const s of t.subtopics) {
      const sub = await prisma.subtopic.create({ data: { name: s, topicId: topicObj.id } });
      subtopicMap[s] = sub.id;
      subtopicsList.push({ id: sub.id, name: s, category: "QUANT" });

      // Add actual CAT formulas
      const sheetContent = quantFormulaSheets[s] || `<div class='space-y-4 text-slate-800 dark:text-slate-100'>
        <h3 class='text-xl font-bold border-b pb-2'>${s} Formulas</h3>
        <p>Formula sheet for CAT Specific preparation in ${s}.</p>
      </div>`;

      await prisma.formulaSheet.create({
        data: {
          title: `${s} Formula Sheet`,
          content: sheetContent,
          subtopicId: sub.id,
        },
      });

      if (defaultUser) {
        await prisma.userProgress.create({
          data: {
            userId: defaultUser.id,
            subtopicId: sub.id,
            formulaSheetRead: Math.random() > 0.4,
            practiceQuestionsCompleted: Math.random() > 0.4,
            topicTestCompleted: Math.random() > 0.5,
            revisionDone: Math.random() > 0.6,
          },
        });
      }
    }
  }

  // Seed VARC
  for (const t of varcTopics) {
    const topicObj = await prisma.topic.create({ data: { name: t.name, category: "VARC" } });
    for (const s of t.subtopics) {
      const sub = await prisma.subtopic.create({ data: { name: s, topicId: topicObj.id } });
      subtopicMap[s] = sub.id;
      subtopicsList.push({ id: sub.id, name: s, category: "VARC" });

      const varcSheet = varcFormulaSheets[s] || `<div><h3>${s} — CAT Guide</h3><p>Key strategies for ${s} in CAT VARC.</p></div>`;
      await prisma.formulaSheet.create({
        data: {
          title: `${s} Strategy Guide`,
          content: varcSheet,
          subtopicId: sub.id,
        },
      });

      if (defaultUser) {
        await prisma.userProgress.create({
          data: {
            userId: defaultUser.id,
            subtopicId: sub.id,
            formulaSheetRead: Math.random() > 0.4,
            practiceQuestionsCompleted: Math.random() > 0.4,
            topicTestCompleted: Math.random() > 0.5,
            revisionDone: Math.random() > 0.6,
          },
        });
      }
    }
  }

  // Seed LRDI
  for (const t of lrdiTopics) {
    const topicObj = await prisma.topic.create({ data: { name: t.name, category: "LRDI" } });
    for (const s of t.subtopics) {
      const sub = await prisma.subtopic.create({ data: { name: s, topicId: topicObj.id } });
      subtopicMap[s] = sub.id;
      subtopicsList.push({ id: sub.id, name: s, category: "LRDI" });

      const lrdiSheet = lrdiFormulaSheets[s] || `<div><h3>${s} — CAT Strategy</h3><p>Key approaches for ${s} sets in CAT LRDI.</p></div>`;
      await prisma.formulaSheet.create({
        data: {
          title: `${s} Strategy Sheet`,
          content: lrdiSheet,
          subtopicId: sub.id,
        },
      });

      if (defaultUser) {
        await prisma.userProgress.create({
          data: {
            userId: defaultUser.id,
            subtopicId: sub.id,
            formulaSheetRead: Math.random() > 0.4,
            practiceQuestionsCompleted: Math.random() > 0.4,
            topicTestCompleted: Math.random() > 0.5,
            revisionDone: Math.random() > 0.6,
          },
        });
      }
    }
  }

  console.log("Topics & Subtopics seeded.");

  // 4. Seed 10 RC Passages for each of the 4 Reading Comprehension subtopics (40 total)
  const rcPassagesData: { id: string; subtopicId: string; title: string; content: string }[] = [];
  const rcSubtopics = ["Science & Technology RC", "History & Culture RC", "Philosophy RC", "Economics RC"];

  const rcPassageTemplates = [
    {
      title: "Quantum Computing Horizons",
      content: "Quantum computing represents a paradigm shift in computing technology. Unlike classical computers that encode information in bits (0s and 1s), quantum computers use qubits, which can exist in a superposition of states. This allows quantum systems to evaluate complex computations in parallel. Furthermore, entanglement allows qubits that are physically separated to share state instantly. The main hurdle remains decoherence, where external noise disrupts the fragile quantum states. Overcoming this will unlock cryptanalytic and molecular simulation breakthroughs."
    },
    {
      title: "The Roman Imperial Collapse",
      content: "Historians have long debated the primary drivers of the fall of the Western Roman Empire. While Edward Gibbon emphasized moral decay and the rise of Christianity, modern material history focuses on economic stagnation, soil exhaustion, and climate fluctuations. The empire's reliance on slave labor disincentivized technological innovation, while administrative bloat required unsustainable tax rates. Combined with migrations and localized inflation, the political structure fractured under its own weight rather than falling to a single military blow."
    },
    {
      title: "Existentialism and Choice",
      content: "Existentialism, popularised by Sartre, Camus, and de Beauvoir, asserts that 'existence precedes essence.' Humans are not born with a predefined purpose; instead, they must construct meaning through autonomous choices. This radical freedom induces existential dread or anxiety, as there is no moral framework to shift responsibility onto. Living authentically means accepting this anxiety and acting decisively, whereas denial of choice is termed 'bad faith' by Sartre."
    },
    {
      title: "Behavioral Economics and Nudges",
      content: "Classical economics assumes agents are rational actors maximizing utility. Behavioral economics, spearheaded by Kahneman and Tversky, proves that humans rely on heuristics that yield systematic cognitive biases. For instance, loss aversion dictates that losing $100 hurts twice as much as gaining $100 pleases. By designing choice architectures using subtle 'nudges'—like changing default choices for pension savings—policy makers can guide individuals toward optimal choices without restricting freedom."
    }
  ];

  for (const sName of rcSubtopics) {
    const sId = subtopicMap[sName];
    for (let pIdx = 1; pIdx <= 10; pIdx++) {
      const template = rcPassageTemplates[(pIdx - 1) % rcPassageTemplates.length];
      const pId = randomUUID();
      rcPassagesData.push({
        id: pId,
        subtopicId: sId,
        title: `${template.title} - Set ${pIdx}`,
        content: `${template.content} This is passage section ${pIdx} evaluating advanced reading comprehension markers. It is designed to test structural reasoning, critical inferences, and vocabulary in context for the CAT exam.`
      });
    }
  }

  // Batch insert RC Passages
  await prisma.rCPassage.createMany({
    data: rcPassagesData.map(p => ({ id: p.id, title: p.title, content: p.content }))
  });
  console.log("40 RC Passages seeded.");

  // 5. Seed 10 LRDI Sets for each of the 7 LRDI subtopics (70 total)
  const lrdiSetsData: { id: string; subtopicId: string; title: string; description: string }[] = [];
  const lrdiSubtopics = ["Arrangement", "Games and Tournaments", "Selection", "Distribution", "Venn Diagram", "Caselets", "Mixed Sets"];

  const lrdiSetTemplates = [
    {
      title: "Circular Seating Grid",
      description: "Eight delegates - A, B, C, D, E, F, G, and H sit around a circular table facing the center. A sits third to the left of G, who sits adjacent to C. F sits opposite to D. H sits adjacent to neither G nor A. B sits adjacent to E. Exactly three seats separate E and G."
    },
    {
      title: "Round Robin Statistics",
      description: "Four tennis players - P, Q, R, and S play a round-robin tournament where each player plays every other player exactly once. A win gets 2 points, draw 1 point, and loss 0. P finished with 4 points, Q had 3 points. No player remained undefeated. R and S draw their match."
    },
    {
      title: "Project Allocation Matrix",
      description: "A manager must select a team of 4 software engineers from a pool of 7 engineers: P, Q, R, S, T, U, and V. At least one of Q or R must be selected. If P is selected, T cannot be selected. S and U must either be selected together or rejected together. V cannot be selected unless R is selected."
    }
  ];

  for (const sName of lrdiSubtopics) {
    const sId = subtopicMap[sName];
    for (let setIdx = 1; setIdx <= 10; setIdx++) {
      const template = lrdiSetTemplates[(setIdx - 1) % lrdiSetTemplates.length];
      const setId = randomUUID();
      lrdiSetsData.push({
        id: setId,
        subtopicId: sId,
        title: `${template.title} - Case ${setIdx}`,
        description: `${template.description} Analyze the conditions for Set ${setIdx} and answer the 10 questions linked below.`
      });
    }
  }

  // Batch insert LRDI Sets
  await prisma.lRDISet.createMany({
    data: lrdiSetsData.map(s => ({ id: s.id, title: s.title, description: s.description }))
  });
  console.log("70 LRDI Sets seeded.");

  // 6. Programmatically Generate 100 questions per subtopic (3,900 questions total)
  const questionsToInsert: {
    id: string;
    content: string;
    type: string;
    difficulty: string;
    subtopicId: string | null;
    rcPassageId: string | null;
    lrdiSetId: string | null;
    solution: string;
  }[] = [];

  const optionsToInsert: {
    id: string;
    content: string;
    isCorrect: boolean;
    questionId: string;
  }[] = [];

  const subtopicQuestionsMap: Record<string, string[]> = {};

  const quantPyqIds: string[] = [];
  const varcPyqIds: string[] = [];
  const lrdiPyqIds: string[] = [];

  for (const sub of subtopicsList) {
    subtopicQuestionsMap[sub.id] = [];
    const isRC = sub.name.includes("RC");
    const isLRDI = lrdiSubtopics.includes(sub.name);

    for (let qIdx = 1; qIdx <= 100; qIdx++) {
      const qId = `q-${sub.id}-${qIdx}`;
      subtopicQuestionsMap[sub.id].push(qId);

      const difficulty = qIdx <= 33 ? "EASY" : qIdx <= 67 ? "MEDIUM" : "HARD";
      const type = qIdx % 10 === 0 ? "TITA" : "MCQ"; // 10% TITA questions

      let content = "";
      let solution = "";
      let correctAnsText = "";
      let optionsList: string[] = [];
      let rcPassageId: string | null = null;
      let lrdiSetId: string | null = null;

      if (isRC) {
        // Link to one of the 10 RC Passages
        const passageIndex = Math.floor((qIdx - 1) / 10); // 10 questions per passage
        const subPassages = rcPassagesData.filter(p => p.subtopicId === sub.id);
        const passage = subPassages[passageIndex] || subPassages[0];
        rcPassageId = passage.id;

        content = `According to Passage Set [${passage.title.split("-")[1].trim()}], which of the following statements matches the author's primary argument concerning the topic? (Q-${qIdx})`;
        solution = `Shortcut / Easiest Way:\nRefer directly to paragraph 2. The author highlights the core mechanisms that define the topic, supporting option A. Options B, C, and D represent common distractors (misstatements or out-of-context facts).`;
        correctAnsText = "Option A represents the primary argument supported by the text.";
        optionsList = [
          "Option A represents the primary argument supported by the text.",
          "Option B contradicts the main thesis in paragraph 1.",
          "Option C introduces an irrelevant external fact.",
          "Option D exaggerates a minor detail in the passage."
        ];
      } else if (isLRDI) {
        // Link to one of the 10 LRDI Sets
        const setIndex = Math.floor((qIdx - 1) / 10);
        const subSets = lrdiSetsData.filter(s => s.subtopicId === sub.id);
        const lrdiSet = subSets[setIndex] || subSets[0];
        lrdiSetId = lrdiSet.id;

        content = `Based on the parameters defined in [${lrdiSet.title.split("-")[1].trim()}], what is the value or position that satisfies all conditions? (Q-${qIdx})`;
        solution = `Shortcut / Easiest Way:\nWrite down the grid of constraints. Under the given conditions, the values fall into a linear sequence. The only option matching all bounds is the correct answer.`;
        correctAnsText = "Value = 4 (or Option A)";
        optionsList = ["Value = 4 (or Option A)", "Value = 6", "Value = 2", "Cannot be determined"];
      } else {
        // Quant & Verbal questions generated mathematically / logically
        const x = ((qIdx * 7) % 20) + 5; // 5 to 24
        const y = ((qIdx * 11) % 30) + 10; // 10 to 39
        const z = ((qIdx * 13) % 40) + 50; // 50 to 89

        if (sub.category === "QUANT") {
          if (qIdx % 3 === 0) {
            // Percentages/Ratios/Math type 1
            const ans = Math.round((x * y) / 10) * 10;
            content = `A town has a population of ${z * 100}. If the number of males increases by ${x}% and females by ${y}%, the total population becomes ${z * 100 + ans}. Find the number of males in the town originally.`;
            solution = `Shortcut / Easiest Way:\nLet males be M and females be F. M + F = ${z * 100}.\nIncrease: 0.${x}M + 0.${y}F = ${ans}.\nMultiply first equation by 0.${x} and subtract: (0.${y} - 0.${x})F = ${ans} - ${x * z}.\nSolve for F and M. Original males = ${Math.round(z * 100 - ans / 2)}.`;
            correctAnsText = String(Math.round(z * 100 - ans / 2));
            optionsList = [String(Math.round(z * 100 - ans / 2)), String(Math.round(z * 80)), String(Math.round(z * 120)), "None of these"];
          } else if (qIdx % 3 === 1) {
            // Math type 2
            const speed = x + 30; // 35 to 54
            const timeDiff = y; // 10 to 39 mins
            const dist = Math.round((speed * (speed + 10) * timeDiff) / 600);
            content = `A student walks from home to school at ${speed} km/h and arrives ${timeDiff} minutes late. If he increases his speed by 10 km/h, he arrives early. What is the distance between his home and school in km?`;
            solution = `Shortcut / Easiest Way:\nUse the speed-ratio method. Ratio of speeds = ${speed} : ${speed + 10}.\nSince distance is constant, ratio of times is ${speed + 10} : ${speed}.\nDifference in time parts = 1 part = ${timeDiff} mins.\nCalculate total distance = ${dist} km.`;
            correctAnsText = `${dist} km`;
            optionsList = [`${dist} km`, `${dist + 5} km`, `${dist - 3} km`, `${Math.round(dist * 1.5)} km`];
          } else {
            // Math type 3
            const terms = x + 10;
            const ans = Math.round((terms * (terms + 1)) / 2);
            content = `Find the sum of the first ${terms} terms of the series: 1, 2, 3, ..., ${terms}.`;
            solution = `Shortcut / Easiest Way:\nApply the sum of first N natural numbers formula: N(N + 1) / 2.\nHere N = ${terms}.\nSum = [${terms} &times; ${terms + 1}] / 2 = ${ans}.`;
            correctAnsText = String(ans);
            optionsList = [String(ans), String(ans + terms), String(ans - terms), String(ans * 2)];
          }
        } else {
          // Verbal Ability fallback
          content = `Choose the option that represents the best summary of the paragraph about ${sub.name} (Q-${qIdx}).`;
          solution = `Shortcut / Easiest Way:\nIdentify key arguments: sentence 1 introduces premise, sentence 2 limits scope. Option A correctly aggregates these items without adding out-of-bounds claims.`;
          correctAnsText = "Option A correctly captures all core claims without logic distortions.";
          optionsList = [
            "Option A correctly captures all core claims without logic distortions.",
            "Option B misses the primary limitation outlined in sentence 2.",
            "Option C overgeneralizes the conclusion.",
            "Option D contradicts the introductory premise."
          ];
        }
      }

      if (qIdx <= 30) {
        const year = 2017 + ((qIdx - 1) % 8);
        content = `[CAT ${year}] ${content}`;
        if (sub.category === "QUANT") {
          quantPyqIds.push(qId);
        } else if (sub.category === "VARC") {
          varcPyqIds.push(qId);
        } else if (sub.category === "LRDI") {
          lrdiPyqIds.push(qId);
        }
      }

      // Add to Questions
      questionsToInsert.push({
        id: qId,
        content,
        type,
        difficulty,
        subtopicId: sub.id,
        rcPassageId,
        lrdiSetId,
        solution
      });

      // Add to Options
      if (type === "MCQ") {
        optionsList.forEach((optText, oIdx) => {
          optionsToInsert.push({
            id: `opt-${qId}-${oIdx}`,
            content: optText,
            isCorrect: optText === correctAnsText,
            questionId: qId
          });
        });
      }
    }
  }

  // Batch insert all 3,900 questions
  console.log("Inserting questions into database...");
  await prisma.question.createMany({ data: questionsToInsert });
  console.log(`Inserted ${questionsToInsert.length} questions.`);

  // Batch insert options
  console.log("Inserting options into database...");
  await prisma.option.createMany({ data: optionsToInsert });
  console.log(`Inserted ${optionsToInsert.length} options.`);

  // 7. Seed tests in database
  const testsToInsert: {
    id: string;
    name: string;
    type: string;
    category: string;
    duration: number;
  }[] = [];

  const testQuestionsToInsert: {
    id: string;
    testId: string;
    questionId: string;
    order: number;
  }[] = [];

  // A. 5 Tests per subtopic (39 subtopics * 5 = 195 tests)
  console.log("Generating 195 subtopic tests...");
  for (const sub of subtopicsList) {
    const qIds = subtopicQuestionsMap[sub.id];
    for (let testIdx = 1; testIdx <= 5; testIdx++) {
      const testId = `t-sub-${sub.id}-${testIdx}`;
      testsToInsert.push({
        id: testId,
        name: `${sub.name} Topic Test ${testIdx}`,
        type: "TOPIC",
        category: sub.category,
        duration: 15
      });

      // Pick 10 questions for the test (index offsets to ensure diversity)
      for (let o = 0; o < 10; o++) {
        const qIndex = ((testIdx - 1) * 10 + o) % 100;
        testQuestionsToInsert.push({
          id: `tq-sub-${sub.id}-${testIdx}-${o}`,
          testId,
          questionId: qIds[qIndex],
          order: o + 1
        });
      }
    }
  }

  // B. 5 Tests per domain (9 domains * 5 = 45 tests)
  console.log("Generating 45 domain tests...");
  const domains = [
    { name: "Arithmetic", category: "QUANT", subtopics: ["Percentages", "Profit and Loss", "Ratio and Proportion", "Averages", "Mixtures", "Time and Work", "Time Speed Distance", "SI and CI"] },
    { name: "Algebra", category: "QUANT", subtopics: ["Linear Equations", "Quadratic Equations", "Logarithms", "Functions", "Sequences and Series"] },
    { name: "Geometry", category: "QUANT", subtopics: ["Triangles", "Circles", "Polygons", "Coordinate Geometry", "Mensuration"] },
    { name: "Number System", category: "QUANT", subtopics: ["Properties of Numbers", "Divisibility Rules", "LCM and HCF", "Remainders"] },
    { name: "Modern Math", category: "QUANT", subtopics: ["Permutation and Combination", "Probability", "Set Theory"] },
    { name: "Reading Comprehension", category: "VARC", subtopics: ["Science & Technology RC", "History & Culture RC", "Philosophy RC", "Economics RC"] },
    { name: "Verbal Ability", category: "VARC", subtopics: ["Para Summary", "Para Jumbles", "Odd One Out"] },
    { name: "Logical Reasoning", category: "LRDI", subtopics: ["Arrangement", "Games and Tournaments", "Selection", "Distribution"] },
    { name: "Data Interpretation", category: "LRDI", subtopics: ["Venn Diagram", "Caselets", "Mixed Sets"] }
  ];

  for (const dom of domains) {
    // Collect all question IDs for this domain
    const domQIds: string[] = [];
    dom.subtopics.forEach(sName => {
      const sId = subtopicMap[sName];
      if (sId && subtopicQuestionsMap[sId]) {
        domQIds.push(...subtopicQuestionsMap[sId]);
      }
    });

    for (let testIdx = 1; testIdx <= 5; testIdx++) {
      const testId = `t-dom-${dom.name.replace(/\s+/g, "")}-${testIdx}`;
      testsToInsert.push({
        id: testId,
        name: `${dom.name} Sectional Test ${testIdx}`,
        type: "SECTION",
        category: dom.category,
        duration: 25
      });

      // Pick 15 questions for the domain test
      for (let o = 0; o < 15; o++) {
        const qIndex = ((testIdx - 1) * 15 + o) % domQIds.length;
        testQuestionsToInsert.push({
          id: `tq-dom-${dom.name.replace(/\s+/g, "")}-${testIdx}-${o}`,
          testId,
          questionId: domQIds[qIndex],
          order: o + 1
        });
      }
    }
  }

  // C. 10 Full Quant Sectional Tests (10 tests)
  console.log("Generating 10 Full Quant Sectional Tests...");
  const allQuantQIds: string[] = [];
  subtopicsList.filter(s => s.category === "QUANT").forEach(s => {
    allQuantQIds.push(...subtopicQuestionsMap[s.id]);
  });

  for (let testIdx = 1; testIdx <= 10; testIdx++) {
    const testId = `t-mock-quant-${testIdx}`;
    testsToInsert.push({
      id: testId,
      name: `Full Quant Sectional Test ${testIdx}`,
      type: "MOCK",
      category: "QUANT",
      duration: 40
    });

    // Pick 22 questions (actual CAT format)
    for (let o = 0; o < 22; o++) {
      const qIndex = ((testIdx - 1) * 22 + o) % allQuantQIds.length;
      testQuestionsToInsert.push({
        id: `tq-mock-quant-${testIdx}-${o}`,
        testId,
        questionId: allQuantQIds[qIndex],
        order: o + 1
      });
    }
  }

  // D. 15 CAT PYQ Sectional Tests (5 Quant, 5 VARC, 5 LRDI) - 10 questions, 20 mins each
  console.log("Generating 15 CAT PYQ Sectional Tests...");
  const categoriesList = [
    { key: "QUANT", pyqs: quantPyqIds, label: "Quant" },
    { key: "VARC", pyqs: varcPyqIds, label: "VARC" },
    { key: "LRDI", pyqs: lrdiPyqIds, label: "LRDI" }
  ];

  for (const cat of categoriesList) {
    for (let testIdx = 1; testIdx <= 5; testIdx++) {
      const testId = `t-pyq-${cat.key.toLowerCase()}-${testIdx}`;
      testsToInsert.push({
        id: testId,
        name: `CAT PYQ ${cat.label} Sectional Test ${testIdx}`,
        type: "SECTION",
        category: cat.key,
        duration: 20
      });

      // Pick 10 questions
      for (let o = 0; o < 10; o++) {
        const qIndex = ((testIdx - 1) * 10 + o) % cat.pyqs.length;
        testQuestionsToInsert.push({
          id: `tq-pyq-${cat.key.toLowerCase()}-${testIdx}-${o}`,
          testId,
          questionId: cat.pyqs[qIndex],
          order: o + 1
        });
      }
    }
  }

  // Batch insert all Tests
  console.log("Inserting tests...");
  await prisma.test.createMany({ data: testsToInsert });
  console.log(`Inserted ${testsToInsert.length} tests.`);

  // Batch insert TestQuestions
  console.log("Inserting test questions mapping...");
  await prisma.testQuestion.createMany({ data: testQuestionsToInsert });
  console.log(`Inserted ${testQuestionsToInsert.length} test-question links.`);

  // 8. Seed Achievements List
  const achievementsList = [
    { title: "First Topic Completed", description: "Successfully finished a formula sheet and practice questions for one topic." },
    { title: "First 100 Questions Solved", description: "Cleared 100 practice questions on the platform." },
    { title: "First Mock Attempted", description: "Submitted your first full-length CAT mock test." },
    { title: "Quant Master", description: "Attained over 80% accuracy in the Quant section." },
    { title: "VARC Master", description: "Attained over 80% accuracy in the VARC section." },
    { title: "LRDI Master", description: "Attained over 80% accuracy in the LRDI section." },
    { title: "CAT Warrior", description: "Completed a Mock test under exam conditions." },
    { title: "30 Day Streak", description: "Maintained a continuous daily prep streak of 30 days." },
    { title: "100 Day Streak", description: "Maintained a continuous daily prep streak of 100 days." },
  ];

  if (defaultUser) {
    for (const ach of achievementsList) {
      if (ach.title === "First Topic Completed" || ach.title === "First Mock Attempted") {
        await prisma.achievement.create({
          data: {
            title: ach.title,
            description: ach.description,
            userId: defaultUser.id,
          },
        });
      }
    }
  }

  console.log("Achievements seeded.");

  const { seedPyqPapers } = await import("./seed-pyq");
  await seedPyqPapers(prisma);

  console.log("Seeding complete. Database is ready for CAT!");
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
