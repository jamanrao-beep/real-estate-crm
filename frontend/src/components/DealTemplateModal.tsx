"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Printer, Image as ImageIcon } from "lucide-react";
import api from "@/lib/api";

interface DealTemplateModalProps {
  deal: any;
  onClose: () => void;
  onSave: () => void;
}

export default function DealTemplateModal({ deal, onClose, onSave }: DealTemplateModalProps) {
  // Load existing details or fallback to empty strings
  const [templateDetails, setTemplateDetails] = useState({
    loanStatus: deal.templateDetails?.loanStatus || "",
    ref: deal.templateDetails?.ref || "",
    sellerName: deal.templateDetails?.sellerName || "",
    sellerAddress: deal.templateDetails?.sellerAddress || "",
    khasraNumber: deal.templateDetails?.khasraNumber || "",
    sqYards: deal.templateDetails?.sqYards || "",
    sqMeters: deal.templateDetails?.sqMeters || "",
    mauja: deal.templateDetails?.mauja || "",
    pargana: deal.templateDetails?.pargana || "",
    tehsil: deal.templateDetails?.tehsil || "",
    district: deal.templateDetails?.district || "",
    documentDate: deal.templateDetails?.documentDate || "",
    contactNumber: deal.templateDetails?.contactNumber || "",
    rate: deal.templateDetails?.rate || "",
    partialPaymentAmount: deal.templateDetails?.partialPaymentAmount || "",
    place: deal.templateDetails?.place || "",
    
    // Page 2 specific
    plotNo: deal.plotNumber || deal.templateDetails?.plotNo || "",
    clientName: deal.lead?.name || "",
    whiteValueRate: deal.templateDetails?.whiteValueRate || "13650",
    totalPlotValue: deal.templateDetails?.totalPlotValue || deal.dealAmount || "",
    
    advocateFee: deal.templateDetails?.advocateFee || "",
    govtReceipt: deal.templateDetails?.govtReceipt || "",
    stampDuty: deal.templateDetails?.stampDuty || "",
    societyCharges: deal.templateDetails?.societyCharges || "",
    demarcationFee: deal.templateDetails?.demarcationFee || "",
    
    payments: deal.templateDetails?.payments || [
      { date: "", utr: "", amount: "" },
      { date: "", utr: "", amount: "" },
      { date: "", utr: "", amount: "" },
      { date: "", utr: "", amount: "" },
      { date: "", utr: "", amount: "" },
    ]
  });

  const [plotImage, setPlotImage] = useState(deal.plotImage || "");

  const handleInputChange = (field: string, value: string) => {
    setTemplateDetails(prev => ({ ...prev, [field]: value }));
  };

  const handlePaymentChange = (index: number, field: string, value: string) => {
    const newPayments = [...templateDetails.payments];
    newPayments[index] = { ...newPayments[index], [field]: value };
    setTemplateDetails(prev => ({ ...prev, payments: newPayments }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPlotImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.patch(`/deals/${deal.id}/template`, {
        plotNumber: templateDetails.plotNo,
        plotImage,
        templateDetails
      });
      onSave(); // Trigger refresh in parent
      alert("Template Details Saved!");
    } catch (err) {
      console.error("Failed to save template", err);
      alert("Failed to save. Check console.");
    }
  };

  const handlePrintPdf = () => {
    window.print();
  };

  // Calculations
  const sqMetersNum = parseFloat(templateDetails.sqMeters) || 0;
  const whiteValueRateNum = parseFloat(templateDetails.whiteValueRate) || 0;
  const whiteValueTotal = sqMetersNum * whiteValueRateNum;
  
  const totalPlotValueNum = parseFloat(templateDetails.totalPlotValue) || 0;
  const cashValue = totalPlotValueNum - whiteValueTotal;

  const advocateFeeNum = parseFloat(templateDetails.advocateFee) || 0;
  const govtReceiptNum = parseFloat(templateDetails.govtReceipt) || 0;
  const stampDutyNum = parseFloat(templateDetails.stampDuty) || Math.round(whiteValueTotal * 0.05);
  const societyChargesNum = parseFloat(templateDetails.societyCharges) || Math.round((parseFloat(templateDetails.sqYards) || 0) * 200);
  const demarcationFeeNum = parseFloat(templateDetails.demarcationFee) || 0;
  const totalCharges = advocateFeeNum + govtReceiptNum + stampDutyNum + societyChargesNum + demarcationFeeNum;
  const totalAmountToBePaid = totalPlotValueNum + totalCharges;

  return (
    <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm z-50 overflow-y-auto print:relative print:inset-auto print:bg-white print:p-0 print:z-auto">
      <div className="min-h-screen py-10 px-4 flex justify-center print:py-0 print:px-0">
        
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-[210mm] flex flex-col relative print:border-none print:shadow-none print:w-[210mm] print:rounded-none">
          
          {/* Header Action Bar - Hidden on Print */}
          <div className="sticky top-0 bg-white/90 backdrop-blur border-b border-border p-4 flex justify-between items-center rounded-t-xl z-10 print:hidden shadow-sm">
            <h3 className="text-lg font-serif text-ink">Receipt of Payment Template</h3>
            <div className="flex gap-3">
              <Button variant="outline" type="button" onClick={onClose}>Close</Button>
              <Button type="button" onClick={handleSave} variant="secondary">Save Data</Button>
              <Button type="button" onClick={handlePrintPdf}>
                <Printer size={16} className="mr-2" /> Print PDF
              </Button>
            </div>
          </div>

          {/* PAGE 1 */}
          <div className="p-[20mm] bg-white text-black min-h-[297mm] print:p-0 print:min-h-0 print:break-after-page">
            
            {/* Top Info */}
            <div className="flex justify-between items-start mb-8 text-sm">
              <div className="flex gap-2">
                <span className="font-semibold">Loan Status:</span>
                <input 
                  type="text" 
                  className="border-b border-black outline-none w-32 bg-transparent"
                  value={templateDetails.loanStatus}
                  onChange={e => handleInputChange('loanStatus', e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <span className="font-semibold">Ref:</span>
                <input 
                  type="text" 
                  className="border-b border-black outline-none w-32 bg-transparent"
                  value={templateDetails.ref}
                  onChange={e => handleInputChange('ref', e.target.value)}
                />
              </div>
            </div>

            <h1 className="text-xl font-bold text-center uppercase tracking-widest mb-12 underline underline-offset-4">Receipt of Payment</h1>

            {/* Legal Paragraph */}
            <div className="text-justify leading-[2.5rem] mb-12 text-[15px]">
              I, <input type="text" className="border-b border-black outline-none min-w-[200px] text-center bg-transparent" placeholder="Seller Name" value={templateDetails.sellerName} onChange={e => handleInputChange('sellerName', e.target.value)} />, 
              resident of <input type="text" className="border-b border-black outline-none min-w-[300px] text-center bg-transparent" placeholder="Address" value={templateDetails.sellerAddress} onChange={e => handleInputChange('sellerAddress', e.target.value)} />, 
              hereby acknowledge that I intend to sell my land bearing Khasra Number <input type="text" className="border-b border-black outline-none w-24 text-center bg-transparent" value={templateDetails.khasraNumber} onChange={e => handleInputChange('khasraNumber', e.target.value)} /> 
              measuring <input type="text" className="border-b border-black outline-none w-24 text-center bg-transparent" value={templateDetails.sqYards} onChange={e => handleInputChange('sqYards', e.target.value)} /> square yards, 
              that is <input type="text" className="border-b border-black outline-none w-24 text-center bg-transparent" value={templateDetails.sqMeters} onChange={e => handleInputChange('sqMeters', e.target.value)} /> square meters, 
              situated at Mauja <input type="text" className="border-b border-black outline-none w-32 text-center bg-transparent" value={templateDetails.mauja} onChange={e => handleInputChange('mauja', e.target.value)} />, 
              Pargana <input type="text" className="border-b border-black outline-none w-32 text-center bg-transparent" value={templateDetails.pargana} onChange={e => handleInputChange('pargana', e.target.value)} />, 
              Tehsil <input type="text" className="border-b border-black outline-none w-32 text-center bg-transparent" value={templateDetails.tehsil} onChange={e => handleInputChange('tehsil', e.target.value)} />, 
              District <input type="text" className="border-b border-black outline-none w-32 text-center bg-transparent" value={templateDetails.district} onChange={e => handleInputChange('district', e.target.value)} />, 
              on <input type="text" className="border-b border-black outline-none w-32 text-center bg-transparent" placeholder="Date" value={templateDetails.documentDate} onChange={e => handleInputChange('documentDate', e.target.value)} />. 
              Contact number <input type="text" className="border-b border-black outline-none w-32 text-center bg-transparent" value={templateDetails.contactNumber} onChange={e => handleInputChange('contactNumber', e.target.value)} />. 
              Rate: <input type="text" className="border-b border-black outline-none w-32 text-center bg-transparent" value={templateDetails.rate} onChange={e => handleInputChange('rate', e.target.value)} />.
              <br/><br/>
              In consideration of this sale, I hereby acknowledge receiving a partial payment amount of Rs. <input type="text" className="border-b border-black outline-none w-32 text-center bg-transparent font-bold" value={templateDetails.partialPaymentAmount} onChange={e => handleInputChange('partialPaymentAmount', e.target.value)} /> 
              on this day, the receipt of which I hereby acknowledge in the presence of the below mentioned witnesses, so that it may remain as a valid record for future reference.
            </div>

            {/* Middle Section (Plot Details & Payment Details) */}
            <div className="grid grid-cols-[1fr_1fr] gap-8 mb-16 items-stretch">
              
              {/* Plot Details Box */}
              <div className="border border-black flex flex-col h-full">
                <div className="bg-gray-100 border-b border-black p-1 text-center font-bold text-sm">Plot Details</div>
                <div className="flex-1 p-4 flex flex-col justify-center items-center relative group min-h-[250px]">
                  {plotImage ? (
                    <>
                      <img src={plotImage} alt="Plot Diagram" className="max-w-[80%] max-h-[80%] object-contain" />
                      <label className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center cursor-pointer print:hidden text-white transition-opacity">
                        <ImageIcon size={24} className="mr-2" /> Change Image
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                      </label>
                    </>
                  ) : (
                    <label className="border-2 border-dashed border-gray-300 w-[80%] aspect-square flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 print:hidden text-gray-400">
                      <ImageIcon size={32} className="mb-2" />
                      <span className="text-sm">Upload Diagram</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                  )}
                </div>
                <div className="p-2 border-t border-black text-sm flex flex-col gap-2">
                  <div className="flex"><span className="w-24 font-semibold">Plot No:</span> <input type="text" className="flex-1 border-b border-dotted border-gray-400 outline-none bg-transparent" value={templateDetails.plotNo} onChange={e => handleInputChange('plotNo', e.target.value)} /></div>
                  <div className="flex"><span className="w-24 font-semibold">Other Details:</span> <input type="text" className="flex-1 border-b border-dotted border-gray-400 outline-none bg-transparent" /></div>
                  <div className="flex"><span className="w-24 font-semibold">Demarcation:</span> <input type="text" className="flex-1 border-b border-dotted border-gray-400 outline-none bg-transparent" /></div>
                </div>
              </div>

              {/* Payment Details Table */}
              <div className="border border-black flex flex-col h-full">
                <div className="bg-gray-100 border-b border-black p-1 text-center font-bold text-sm">Payment Details</div>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-black text-xs">
                    <tr>
                      <th className="border-r border-black p-1 font-semibold w-12">S.No</th>
                      <th className="border-r border-black p-1 font-semibold">Date</th>
                      <th className="border-r border-black p-1 font-semibold">Cheque/UTR No</th>
                      <th className="p-1 font-semibold">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {templateDetails.payments.map((payment: any, idx: number) => (
                      <tr key={idx} className="border-b border-black last:border-0 h-12">
                        <td className="border-r border-black text-center">{idx + 1}</td>
                        <td className="border-r border-black p-0">
                          <input type="text" className="w-full h-full p-1 outline-none text-center bg-transparent" value={payment.date} onChange={e => handlePaymentChange(idx, 'date', e.target.value)} />
                        </td>
                        <td className="border-r border-black p-0">
                          <input type="text" className="w-full h-full p-1 outline-none text-center bg-transparent" value={payment.utr} onChange={e => handlePaymentChange(idx, 'utr', e.target.value)} />
                        </td>
                        <td className="p-0">
                          <input type="text" className="w-full h-full p-1 outline-none text-right font-medium bg-transparent" value={payment.amount} onChange={e => handlePaymentChange(idx, 'amount', e.target.value)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>

            {/* Footer Signatures */}
            <div className="flex justify-between items-end mt-auto text-sm">
              <div className="flex gap-2 items-center">
                <span className="font-semibold">Place:</span>
                <input type="text" className="border-b border-black outline-none w-32 bg-transparent" value={templateDetails.place} onChange={e => handleInputChange('place', e.target.value)} />
              </div>
              
              <div className="flex gap-12">
                <div className="flex flex-col items-center">
                  <div className="h-16 w-40 border-b border-black"></div>
                  <span className="mt-2 text-center text-xs">Seller&apos;s Signature<br/>({templateDetails.sellerName || "Name"})</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="h-16 w-40 border-b border-black"></div>
                  <span className="mt-2 text-center text-xs">Buyer&apos;s Signature<br/>(Name: <input type="text" className="border-b border-dotted border-gray-400 w-20 outline-none text-center bg-transparent" />)</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-16 mt-16 text-sm pl-40">
              <div className="flex gap-2"><span className="font-semibold">Witness 1 Name:</span> <input type="text" className="border-b border-black outline-none w-40 bg-transparent" /></div>
              <div className="flex gap-2"><span className="font-semibold">Witness 2 Name:</span> <input type="text" className="border-b border-black outline-none w-40 bg-transparent" /></div>
            </div>

          </div>

          <div className="h-4 bg-gray-200 print:hidden"></div>

          {/* PAGE 2 */}
          <div className="p-[20mm] bg-white text-black min-h-[297mm] print:p-0 print:min-h-0">
            
            {/* Top Info duplicated */}
            <div className="flex justify-between items-start mb-12 text-sm">
              <div className="flex gap-2"><span className="font-semibold">Loan Status:</span> <input type="text" className="border-b border-black outline-none w-32 bg-transparent" value={templateDetails.loanStatus} onChange={e => handleInputChange('loanStatus', e.target.value)} /></div>
              <div className="flex gap-2"><span className="font-semibold">Ref:</span> <input type="text" className="border-b border-black outline-none w-32 bg-transparent" value={templateDetails.ref} onChange={e => handleInputChange('ref', e.target.value)} /></div>
              <div className="flex gap-2"><span className="font-semibold">Plot No:</span> <input type="text" className="border-b border-black outline-none w-24 bg-transparent font-bold text-lg text-center" value={templateDetails.plotNo} onChange={e => handleInputChange('plotNo', e.target.value)} /></div>
            </div>

            <h1 className="text-xl font-bold text-center uppercase tracking-widest mb-12 underline underline-offset-4">Receipt of Payment</h1>

            {/* Calculations Form */}
            <div className="max-w-[160mm] mx-auto space-y-8 text-sm">
              
              {/* Client Details */}
              <div className="border border-black p-4 relative">
                <div className="absolute -top-3 left-4 bg-white px-2 font-bold text-xs uppercase">Client Details</div>
                <div className="flex gap-2 mb-3"><span className="font-semibold w-32">Name:</span> <input type="text" className="border-b border-dotted border-gray-400 flex-1 outline-none font-bold bg-transparent" value={templateDetails.clientName} onChange={e => handleInputChange('clientName', e.target.value)} /></div>
                <div className="flex gap-2 items-center">
                  <span className="font-semibold w-32">Total Land Area:</span>
                  <input type="text" className="border-b border-dotted border-gray-400 w-24 outline-none text-center bg-transparent" value={templateDetails.sqYards} readOnly /> Sq. Yard,
                  <input type="text" className="border-b border-dotted border-gray-400 w-24 outline-none text-center ml-2 bg-transparent" value={templateDetails.sqMeters} readOnly /> Sq. Meters
                </div>
              </div>

              {/* Property Valuation */}
              <div className="border border-black p-4 relative">
                <div className="absolute -top-3 left-4 bg-white px-2 font-bold text-xs uppercase">Property Valuation</div>
                
                <div className="flex gap-2 mb-2">
                  <span className="font-semibold min-w-[200px]">White Value (As per Circle Rate):</span> 
                  <span>₹</span>
                  <input type="number" className="border-b border-dotted border-gray-400 w-24 outline-none text-center bg-transparent" value={templateDetails.whiteValueRate} onChange={e => handleInputChange('whiteValueRate', e.target.value)} /> 
                  <span className="mx-2">x</span>
                  <input type="text" className="border-b border-dotted border-gray-400 w-24 outline-none text-center bg-transparent" value={templateDetails.sqMeters} readOnly /> 
                  <span className="mx-2">Sq. meters =</span>
                  <span className="font-bold border-b border-black min-w-[100px] inline-block text-right">₹ {whiteValueTotal.toLocaleString('en-IN', {maximumFractionDigits: 2})}</span>
                </div>

                <div className="flex gap-2 mb-4">
                  <span className="font-semibold min-w-[200px] pl-4">Total Plot Value:</span> 
                  <span className="font-bold border-b border-black min-w-[150px] inline-block">₹ <input type="number" className="outline-none w-32 bg-transparent" value={templateDetails.totalPlotValue} onChange={e => handleInputChange('totalPlotValue', e.target.value)} /></span>
                </div>

                <div className="flex gap-2 mb-2">
                  <span className="font-semibold">Cash Value (Difference between Total & White Value):</span> 
                </div>
                <div className="flex gap-2 pl-4">
                  <span>Total Plot Value - White Value =</span>
                  <span className="font-bold border-b border-black min-w-[150px] inline-block text-right">₹ {cashValue.toLocaleString('en-IN', {maximumFractionDigits: 2})}</span>
                </div>
              </div>

              {/* Charges on Registry */}
              <div className="border border-black p-4 relative">
                <div className="absolute -top-3 left-4 bg-white px-2 font-bold text-xs uppercase">Charges on Registry</div>
                
                <table className="w-full mt-2">
                  <thead>
                    <tr className="border-b border-black">
                      <th className="text-left font-semibold p-2 border-r border-black w-[40%]">Description</th>
                      <th className="text-center font-semibold p-2 border-r border-black w-[30%]">Amount (₹)</th>
                      <th className="text-left font-semibold p-2">Remark</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-black">
                      <td className="p-2 border-r border-black">Advocate Fee</td>
                      <td className="p-0 border-r border-black"><input type="number" className="w-full h-full p-2 outline-none text-right bg-transparent" value={templateDetails.advocateFee} onChange={e => handleInputChange('advocateFee', e.target.value)} /></td>
                      <td className="p-0"><input type="text" className="w-full h-full p-2 outline-none bg-transparent" /></td>
                    </tr>
                    <tr className="border-b border-black">
                      <td className="p-2 border-r border-black">Govt Receipt</td>
                      <td className="p-0 border-r border-black"><input type="number" className="w-full h-full p-2 outline-none text-right bg-transparent" value={templateDetails.govtReceipt} onChange={e => handleInputChange('govtReceipt', e.target.value)} /></td>
                      <td className="p-0"><input type="text" className="w-full h-full p-2 outline-none bg-transparent" /></td>
                    </tr>
                    <tr className="border-b border-black">
                      <td className="p-2 border-r border-black">Stamp Duty (5% of White Value)</td>
                      <td className="p-0 border-r border-black"><input type="number" className="w-full h-full p-2 outline-none text-right bg-transparent" value={templateDetails.stampDuty || (whiteValueTotal * 0.05).toFixed(0)} onChange={e => handleInputChange('stampDuty', e.target.value)} /></td>
                      <td className="p-0"><input type="text" className="w-full h-full p-2 outline-none bg-transparent" /></td>
                    </tr>
                    <tr className="border-b border-black">
                      <td className="p-2 border-r border-black">Society Charges (₹200 per Gaj)</td>
                      <td className="p-0 border-r border-black"><input type="number" className="w-full h-full p-2 outline-none text-right bg-transparent" value={templateDetails.societyCharges || (parseFloat(templateDetails.sqYards || "0") * 200).toFixed(0)} onChange={e => handleInputChange('societyCharges', e.target.value)} /></td>
                      <td className="p-0"><input type="text" className="w-full h-full p-2 outline-none bg-transparent" /></td>
                    </tr>
                    <tr>
                      <td className="p-2 border-r border-black">Demarcation</td>
                      <td className="p-0 border-r border-black"><input type="number" className="w-full h-full p-2 outline-none text-right bg-transparent" value={templateDetails.demarcationFee} onChange={e => handleInputChange('demarcationFee', e.target.value)} /></td>
                      <td className="p-0"><input type="text" className="w-full h-full p-2 outline-none bg-transparent" /></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Total Payment Details */}
              <div className="border border-black p-4 relative">
                <div className="absolute -top-3 left-4 bg-white px-2 font-bold text-xs uppercase">Total Payment Details</div>
                <div className="flex gap-2 items-center mt-2">
                  <span className="font-semibold w-48">Total Amount to Be Paid: ₹</span>
                  <input type="text" className="border-b border-dotted border-gray-400 flex-1 outline-none font-bold text-lg bg-transparent" value={totalAmountToBePaid ? totalAmountToBePaid.toLocaleString('en-IN') : ""} readOnly />
                </div>
              </div>

            </div>

          </div>

        </div>
      </div>
    </div>
  );
}